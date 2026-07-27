$ErrorActionPreference = 'Stop'

$PackageName = 'webrtcdevelopment'
$RegistryUrl = "https://registry.npmjs.org/$PackageName"
$OutputPath = Join-Path $PSScriptRoot '..\status.json'
$MarkdownPath = Join-Path $PSScriptRoot '..\STATUS.md'

$pkg = Invoke-RestMethod -Uri $RegistryUrl
$latest = $pkg.'dist-tags'.latest
$v = $pkg.versions.$latest

$maintainers = @()
if ($pkg.maintainers) {
    $maintainers = @($pkg.maintainers | ForEach-Object { "{0} <{1}>" -f $_.name, $_.email })
}

$status = [ordered]@{
    package = $PackageName
    latestVersion = $latest
    license = $v.license
    publishedAt = $pkg.time.$latest
    modified = $pkg.time.modified
    totalVersions = @($pkg.versions.PSObject.Properties.Name).Count
    repositoryUrl = $v.repository.url
    homepage = $v.homepage
    npmUrl = "https://www.npmjs.com/package/$PackageName"
    unpackedSize = $v.dist.unpackedSize
    fileCount = $v.dist.fileCount
    dependencies = $v.dependencies
    maintainers = $maintainers
    fetchedAt = (Get-Date).ToString('o')
}

$status | ConvertTo-Json -Depth 12 | Set-Content -Path $OutputPath -Encoding utf8

$dependencies = @()
if ($status.dependencies) {
    $dependencies = @($status.dependencies.PSObject.Properties | Sort-Object Name)
}

$maintainerLines = if ($maintainers.Count -gt 0) {
    ($maintainers | ForEach-Object { "- $_" }) -join "`n"
} else {
    '- none'
}

$dependencyLines = if ($dependencies.Count -gt 0) {
    ($dependencies | ForEach-Object { "- {0}: {1}" -f $_.Name, $_.Value }) -join "`n"
} else {
    '- none'
}

$markdown = @"
# Package Status: webrtcdevelopment

- Package: [$PackageName](https://www.npmjs.com/package/$PackageName)
- Latest version: $($status.latestVersion)
- License: $($status.license)
- Published at: $($status.publishedAt)
- Registry modified: $($status.modified)
- Total versions: $($status.totalVersions)
- Unpacked size: $($status.unpackedSize) bytes
- File count: $($status.fileCount)
- Repository: $($status.repositoryUrl)
- Homepage: $($status.homepage)
- Fetched at: $($status.fetchedAt)

## Maintainers
$maintainerLines

## Dependencies
$dependencyLines
"@

$markdown | Set-Content -Path $MarkdownPath -Encoding utf8

Write-Output "Updated $OutputPath and $MarkdownPath with version $latest"
