# NetKit

中文、适配手机的静态工具网站，包含：

- IPv4/CIDR/子网掩码计算、网关校验和等长子网划分。
- UTC 与新加坡 UTC+8 双向时间换算及当前时钟。
- 20 种常用货币的每日参考汇率兑换、货币交换及本地缓存。

无需构建或安装依赖。用 `python -m http.server 8080` 预览，访问 `http://localhost:8080`。

运行计算逻辑测试：`node --test tests/core.test.cjs`。

## 发布

已启用 GitHub Pages，网址为 https://funsky96-lab.github.io/netkit/ 。使用 `main` 分支根目录，代码更新后自动发布，无需重复设置 Pages。

云端环境通过已授权的 `gh` API 发布，无需额外安装依赖或手动输入令牌。更新 NetKit：

```sh
python scripts/publish.py . --root-update
```

以后新静态网站可以放在独立子目录，全自动上线，无需新建仓库或重新设置 Pages：

```sh
python scripts/publish.py /path/to/new-site --site my-new-site
```

网址为 `https://funsky96-lab.github.io/netkit/my-new-site/`。网站应使用相对路径引用资源。脚本保留其他网站和未修改文件，不删除远程文件；等待 Pages 构建并检查首页返回 200 且内容匹配。支持 `--dry-run` 预览，`--include 文件路径` 仅发布指定文件。默认跳过隐藏文件、测试、脚本、依赖目录和符号链接。

独立新仓库仍需要创建仓库与启用 Pages 的权限，当前连接对应 API 返回 403；复用已启用的仓库不受这两项限制。

## 计算规则与数据

- /31 按 RFC 3021 点对点网络计算；/32 为单个主机地址。
- 网关候选只是可用范围的端点，实际网关需确认路由器配置。
- 子网最多展示前 256 行，但提供完整子网总数。
- 汇率来自 [Exchange API](https://github.com/fawazahmed0/exchange-api)，通过 jsDelivr 获取 USD 基准表后计算交叉汇率。显示数据日期；请求失败时可使用本地缓存并提示。数据每日更新，非实时交易报价。
- 网络与时间计算不上传输入；汇率仅请求公开 USD 汇率表。
- 本地存储不可用时仍可计算，页面偏好和汇率缓存不会保存。
