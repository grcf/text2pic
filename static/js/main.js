document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('text');
    const preview = document.getElementById('preview');
    const generateBtn = document.getElementById('generate');
    const downloadBtn = document.getElementById('download');
    const outputImg = document.getElementById('output');
    const resultDiv = document.getElementById('result');
    const copyBtn = document.getElementById('copy');

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
        addCodeBlockHoverEffect();
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
        
        try {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<span class="loading-spinner"></span>生成中...';
            
            // 添加截图时的特殊类
            previewParent.classList.add('for-screenshot');
            
            // 确保预览内容已更新
            updatePreview();
            
            // 等待样式应用和内容渲染
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(previewParent, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgUrl = canvas.toDataURL('image/png');
            outputImg.src = imgUrl;
            downloadBtn.href = imgUrl;
            downloadBtn.classList.remove('hidden');
            copyBtn.classList.remove('hidden');
            resultDiv.style.display = 'block';
            resultDiv.offsetHeight; // 强制重排
            resultDiv.classList.add('show');
            
        } catch (error) {
            console.error('生成图片时出错:', error);
            alert('生成图片时出错，请重试');
        } finally {
            // 移除截图时的特殊类
            previewParent.classList.remove('for-screenshot');
            
            generateBtn.disabled = false;
            generateBtn.innerHTML = '生成图片';
        }
    });

    // 初始预览
    updatePreview();

    // 添加复制图片功能
    copyBtn.addEventListener('click', async function() {
        try {
            const imgUrl = outputImg.src;
            const response = await fetch(imgUrl);
            const blob = await response.blob();
            
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob
                })
            ]);
            
            // 临时改变按钮文字显示复制成功
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '复制成功！';
            copyBtn.classList.add('success');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('success');
            }, 2000);
            
        } catch (error) {
            console.error('复制图片失败:', error);
            alert('复制图片失败，请重试或使用下载功能');
        }
    });
});

// 添加文本框输入动画效果
editor.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// 添加代码块动态高亮效果
function addCodeBlockHoverEffect() {
    const codeBlocks = document.querySelectorAll('.markdown-body pre');
    codeBlocks.forEach(block => {
        block.addEventListener('mousemove', e => {
            const rect = block.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            block.style.background = `radial-gradient(circle at ${x}px ${y}px, #2d3142, #292d3e)`;
        });
        
        block.addEventListener('mouseleave', () => {
            block.style.background = '#292d3e';
        });
    });
}
