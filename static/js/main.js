document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('text');
    const preview = document.getElementById('preview');
    const generateBtn = document.getElementById('generate');
    const downloadBtn = document.getElementById('download');
    const outputImg = document.getElementById('output');
    const resultDiv = document.getElementById('result');

    // 配置marked
    marked.setOptions({
        highlight: function(code, lang) {
            if (Prism.languages[lang]) {
                return Prism.highlight(code, Prism.languages[lang], lang);
            }
            return code;
        },
        breaks: true,
        gfm: true
    });

    // 实时预览功能
    function updatePreview() {
        const markdown = editor.value;
        preview.innerHTML = marked.parse(markdown);
        // 应用代码高亮
        preview.querySelectorAll('pre code').forEach((block) => {
            Prism.highlightElement(block);
        });
    }

    editor.addEventListener('input', updatePreview);

    // 生成图片功能
    generateBtn.addEventListener('click', async function() {
        if (!editor.value.trim()) {
            alert('请输入要转换的文本！');
            return;
        }

        const previewContainer = document.getElementById('preview');
        const previewParent = previewContainer.parentElement.parentElement;
        const macWindow = document.querySelector('.mac-window-content');
        
        try {
            generateBtn.disabled = true;
            generateBtn.textContent = '生成中...';
            
            // 确保预览内容已更新
            updatePreview();

            // 修改样式以显示完整内容
            macWindow.style.cssText = 'padding: 16px; background: white; height: auto; overflow: visible;';
            previewParent.style.cssText = 'height: auto; overflow: visible;';
            previewContainer.style.cssText = 'height: auto; overflow: visible;';
            
            // 等待样式应用和内容渲染
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(previewParent, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                onclone: function(clonedDoc) {
                    const clonedPreview = clonedDoc.getElementById('preview');
                    if (clonedPreview) {
                        const clonedParent = clonedPreview.parentElement;
                        // 确保克隆的元素也应用相同的样式
                        clonedParent.style.cssText = 'height: auto; overflow: visible;';
                        clonedPreview.style.cssText = 'height: auto; overflow: visible;';
                        
                        // 重新应用代码高亮
                        const codeBlocks = clonedPreview.querySelectorAll('pre code');
                        codeBlocks.forEach((block) => {
                            Prism.highlightElement(block);
                        });
                    }
                }
            });

            const imgUrl = canvas.toDataURL('image/png');
            outputImg.src = imgUrl;
            downloadBtn.href = imgUrl;
            resultDiv.style.display = 'block';
            
        } catch (error) {
            console.error('生成图片时出错:', error);
            alert('生成图片时出错，请重试');
        } finally {
            // 恢复原始样式
            const restoreStyles = () => {
                macWindow.style.cssText = 'padding: 16px; background: white; height: 400px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(0, 0, 0, 0.2) transparent;';
                previewParent.style.cssText = 'height: 400px; overflow-y: auto;';
                previewContainer.style.cssText = 'height: 100%; overflow-y: auto;';
                
                // 强制重新计算布局
                macWindow.offsetHeight;
                previewParent.offsetHeight;
                previewContainer.offsetHeight;
            };

            // 立即恢复一次
            restoreStyles();
            
            // 为确保样式完全应用，延迟后再次恢复
            setTimeout(restoreStyles, 100);
            
            // 恢复按钮状态
            generateBtn.disabled = false;
            generateBtn.textContent = '生成图片';
        }
    });

    // 初始预览
    updatePreview();
});
