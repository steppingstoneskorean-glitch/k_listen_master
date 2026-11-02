# scripts/staff/register-task.ps1
# AI 직원 출근부(run.mjs)를 Windows 작업 스케줄러에 등록 — 매시간 + 로그온할 때 실행.
#   등록:  powershell -ExecutionPolicy Bypass -File scripts\staff\register-task.ps1
#   해제:  Unregister-ScheduledTask -TaskName "StepKorean AI Staff" -Confirm:$false
#   PC 가 켜져 있고 로그인돼 있을 때만 돈다(관리자 권한 불필요). 놓친 일은 다음 실행에서 따라잡는다.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot\..\..").Path
$node = (Get-Command node).Source

# conhost --headless: 매시간 콘솔 창이 깜빡이지 않게 숨겨서 실행 (Windows 11)
$action = New-ScheduledTaskAction -Execute "$env:WINDIR\System32\conhost.exe" `
  -Argument "--headless `"$node`" `"$root\scripts\staff\run.mjs`"" -WorkingDirectory $root
$hourly = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddMinutes(5) -RepetitionInterval (New-TimeSpan -Hours 1)
$logon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 50) -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName 'StepKorean AI Staff' -Action $action -Trigger @($hourly, $logon) -Settings $settings `
  -Description 'K-Listen AI 직원: 퀴즈 초안 · 무료 자료 업로드 · 주간 보고 (scripts/staff/run.mjs)' -Force | Out-Null
Write-Host "등록 완료: StepKorean AI Staff (매시간 + 로그온 시)"
