$env:ELECTRON_RUN_AS_NODE = $null
$env:ELECTRON_RUN_AS_NODE = ""
& "$PSScriptRoot\node_modules\electron\dist\electron.exe" "$PSScriptRoot"
