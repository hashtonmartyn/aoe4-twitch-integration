"return ''" | Out-File -FilePath "C:\aoe4ti\poll_result.scar" -Encoding UTF8

while ($true) {
    $twitchUser = $args[0]
    $uri = "https://backend.aoe4ti.com/poll_result/$twitchUser"
    Write-Host "Get $uri"
    try {
        $response = Invoke-WebRequest -Uri $uri -Method 'GET' -Headers @{'Accept' = 'application/json'}
    } catch {
        Write-Host "Error: $_"
        Start-Sleep -Seconds 2
        continue
    }

    $rJson = $response.Content | ConvertFrom-Json
    Write-Host "Response: $rJson"

    $result = $rJson.result
    $eventId = $rJson.event_id
    "return '$eventId,$result'" | Out-File -FilePath "C:\aoe4ti\poll_result.scar" -Encoding UTF8

    Start-Sleep -Seconds 1
}
