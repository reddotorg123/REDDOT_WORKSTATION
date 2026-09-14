Get-Process | Where-Object { $_.ProcessName -like '*REDDOT*' } | Select-Object Id, ProcessName, StartTime, Responding
