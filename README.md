# RelayX

A decentralized voice chat application based on Tailscale network.

## new network structure

the entire network structure of this app is being rebuilt using pion TURN

## MISC

- 使用electron的desktopcapture仅能捕获整个系统的音频输出，这在此应用的用例下不可用
目前依然回到使用addon的捕获的方案，高cou占用问题依然没有解决，猜测问题出在前端audioworklet节点重建音频流的过程中

- ~~待重构：频谱图绘制使用统一的动画驱动，以大幅削减性能开支~~

core rtc connections manage structrue:

react ui
↑
rtcStore
↑
rtcConnectionManager
↑
rtcConnection
