$ErrorActionPreference = 'Stop'

$PackageName = 'webrtcdevelopment'
$RegistryUrl = "https://registry.npmjs.org/$PackageName"
$OutputPath = Join-Path $PSScriptRoot '..\status.json'

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
Write-Output "Updated $OutputPath with version $latest"
