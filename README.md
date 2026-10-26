# Open Writable File from Diff

A tiny VS Code extension that makes `Git: Open File` invoked from a keybinding open the real workspace file instead of the read-only `git:` document.

让 `Git: Open File` 在 diff 编辑器或只读编辑器里通过快捷键（例如 F4）打开**工作区里的可写文件**，而不是只读的 `git:` 虚拟文档。

## 为什么需要它

VS Code 内置 Git 扩展的 `git.openFile`：

- 由编辑器标题栏的 **Open File** 按钮调用时，会带一个参数（diff 的 modified 资源），命令走 `arg instanceof Uri` 分支，把 `git:` URI 转成工作区文件 URI，所以打开的是可写文件。
- 由快捷键调用时没有参数，命令走 `window.activeTextEditor.document.uri` 回退分支，拿到的是 diff 某一侧的 `git:` URI，且不会再转换，于是打开只读文档。

这个扩展注册了 `diffOpenWritable.openFile`，把当前 diff 的 modified 资源（在只读文档里则是文档自身的 URI）显式传给内置的 `git.openFile`，从而和标题栏按钮走同一条路径。

上游问题：[microsoft/vscode#234814](https://github.com/microsoft/vscode/issues/234814)。

## 安装

从源码打包并安装（需要 Node.js）：

```bash
git clone https://github.com/lgzzzz/vscode-extension.git
cd vscode-extension
npx --yes @vscode/vsce@3 package -o diff-open-writable-0.0.2.vsix --no-dependencies
code --install-extension diff-open-writable-0.0.2.vsix
```

扩展会自动贡献 F4 绑定：

```jsonc
{
  "key": "f4",
  "command": "diffOpenWritable.openFile",
  "when": "(config.git.enabled && isInDiffEditor) || (editorTextFocus && activeEditorIsReadonly)"
}
```

- 在提交历史里打开文件 diff，按 F4 打开工作区中的可写文件。
- 如果 F4 先把只读的 `git:` 文档打开了，在那个只读文档里再按一次 F4，也会打开对应的可写文件。

> 如果 `keybindings.json` 里还留着原来的 F4 → `git.openFile` 绑定（或其它 F4 绑定），用户绑定会覆盖扩展默认绑定，请删除或替换它。扩展无法修改用户自己的 `keybindings.json`。

## 说明

- 需要启用内置 Git 扩展（`vscode.git`）。
- 单文件 diff 使用 `TabInputTextDiff.modified`，与标题栏按钮的参数一致；只读编辑器（如 `git:` 文档）使用当前文档 URI 交给 `git.openFile` 转换。
- 多文件 diff（multi-diff）没有稳定的 tab input API，扩展回退到当前聚焦的 diff 侧，再交给 `git.openFile` 转换；在“重命名且焦点在 original 侧”等少数情况下可能定位到旧路径。
- 只读的 `file:`（例如没有写权限的文件）不会被改成可写；这个扩展解决的是 diff / `git:` 虚拟文档这一路径。
- 只是本地 workaround；真正的修复应在 `extensions/git/src/commands.ts` 中完成。

## 卸载

```bash
code --uninstall-extension lgzzzz.diff-open-writable
```
