# NetKit

中文、适配手机的静态工具网站，包含：

- IPv4/CIDR/子网掩码计算、网关校验和等长子网划分。
- UTC 与新加坡 UTC+8 双向时间换算及当前时钟。
- 20 种常用货币的每日参考汇率兑换、货币交换及本地缓存。

无需构建或安装依赖。用 `python -m http.server 8080` 预览，访问 `http://localhost:8080`。

运行计算逻辑测试：`node --test tests/core.test.cjs`。

## 发布

GitHub Pages 使用 `main` 分支根目录。推送到 main 后由 GitHub Pages 自动发布。

首次发布：在 GitHub 创建空的公开仓库 `funsky96-lab/netkit`，让当前 GitHub 集成获得该仓库读写权限，然后执行：

```sh
git remote add origin https://github.com/funsky96-lab/netkit.git
git push -u origin main
```

在仓库 Settings → Pages 选择 **Deploy from a branch**，分支选 **main**，目录选 **/(root)**。发布网址为 `https://funsky96-lab.github.io/netkit/`。

如果 origin 已存在，用 `git remote set-url origin https://github.com/funsky96-lab/netkit.git` 更新。

## 计算规则与数据

- /31 按 RFC 3021 点对点网络计算；/32 为单个主机地址。
- 网关候选只是可用范围的端点，实际网关需确认路由器配置。
- 子网最多展示前 256 行，但提供完整子网总数。
- 汇率来自 [Exchange API](https://github.com/fawazahmed0/exchange-api)，通过 jsDelivr 获取 USD 基准表后计算交叉汇率。显示数据日期；请求失败时可使用本地缓存并提示。数据每日更新，非实时交易报价。
- 网络与时间计算不上传输入；汇率仅请求公开 USD 汇率表。
- 本地存储不可用时仍可计算，页面偏好和汇率缓存不会保存。
