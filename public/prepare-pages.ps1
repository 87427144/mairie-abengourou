$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputDirectory = Join-Path $projectRoot "dist"
$imagesDirectory = Join-Path $outputDirectory "images"
$sourceImagesDirectory = Join-Path $projectRoot "images"

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
New-Item -ItemType Directory -Path $imagesDirectory -Force | Out-Null

Get-ChildItem -LiteralPath $projectRoot -Filter "*.html" -File |
    Copy-Item -Destination $outputDirectory -Force

Get-ChildItem -LiteralPath $sourceImagesDirectory -File |
    Where-Object { $_.Name -ne "branding 1.jpg" } |
    Copy-Item -Destination $imagesDirectory -Force

Write-Output "Les pages et images prêtes au déploiement sont dans $outputDirectory"
