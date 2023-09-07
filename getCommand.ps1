while ($true) {
    echo "Get"
    $response = Invoke-WebRequest -Uri "http://localhost:8000/poll_result/HeneroAOE" -Method 'GET' -Headers @{'Accept' = 'application/json'}
    $rJson = $response.Content | ConvertFrom-Json
    $result = $rJson.result
    $eventId = $rJson.event_id
    "return '$eventId,$result'" | Out-File -FilePath "C:\aoe4ti\poll_result.scar" -Encoding UTF8

    Start-Sleep -Seconds 1
}
