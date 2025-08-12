# RelayX

A decentralized voice chat application based on Tailscale network.

## new network structure

the entire network structure of this app is being rebuilt using pion TURN

## core rtc connections manage structrue:

react ui
↑
rtcStore
↑
rtcConnectionManager
↑
rtcConnection

## MISC

- 窗口移动到非主显示器时，断开该显示器后窗口依然会停留在主显示器外的坐标
- `tailscale-ipnstate.ts`中的一些定义类型被手动修改以通过tsc编译
- 放弃本地重现最小客户端路线：在尝试重写tailscaled代码时发现其与官方的tailscale客户端严重冲突，
具体表现为注册tun设备所使用的wintun.dll会创建与官方客户端冲突的tun设备（原计划为实现一个简化的本地客户端，注册系统级网络接口以便使用完整的webrtc功能）