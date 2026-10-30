# Open Writable File from Diff

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
git clone https://github.com/lgzzzz/vscode-diff-open-writable.git
cd vscode-diff-open-writable
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

## 卸载

```bash
code --uninstall-extension lgzzzz.diff-open-writable
```
