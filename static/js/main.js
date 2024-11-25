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

    // 将 closeModal 函数移到全局作用域
    window.closeModal = function() {
        const modal = document.getElementById('imageModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // 图片点击预览功能
    outputImg.addEventListener('click', function() {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        modal.style.display = 'flex';
        modalImg.src = this.src;
        modalImg.style.transform = 'scale(1)';
        document.body.style.overflow = 'hidden';
    });

    // 图片缩放功能
    let currentZoom = 1;

    window.zoomImage = function(delta) {
        const modalImg = document.getElementById('modalImage');
        currentZoom = Math.max(0.5, Math.min(3, currentZoom + delta));
        modalImg.style.transform = `scale(${currentZoom})`;
    }

    window.resetZoom = function() {
        const modalImg = document.getElementById('modalImage');
        currentZoom = 1;
        modalImg.style.transform = 'scale(1)';
    }

    // 点击模态框背景关闭
    document.getElementById('imageModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // 添加键盘快捷键支持
    document.addEventListener('keydown', function(e) {
        if (document.getElementById('imageModal').style.display === 'flex') {
            switch(e.key) {
                case 'Escape':
                    closeModal();
                    break;
                case '+':
                case '=':
                    zoomImage(0.1);
                    break;
                case '-':
                    zoomImage(-0.1);
                    break;
                case '0':
                    resetZoom();
                    break;
            }
        }
    });

    // 添加主题切换功能
    const themeSwitcher = document.querySelector('.theme-switcher');
    const macWindows = document.querySelectorAll('.mac-window');
    
    themeSwitcher.addEventListener('click', function(e) {
        if (e.target.classList.contains('theme-option')) {
            // 移除所有主题类
            macWindows.forEach(window => {
                window.classList.remove('theme-default', 'theme-dark', 'theme-blue', 'theme-minimal');
                window.classList.add(`theme-${e.target.dataset.theme}`);
            });
            
            // 更新活动状态
            document.querySelectorAll('.theme-option').forEach(option => {
                option.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // 保存主题选择到 localStorage
            localStorage.setItem('preferred-theme', e.target.dataset.theme);
        }
    });
    
    // 加载保存的主题
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme) {
        macWindows.forEach(window => {
            window.classList.remove('theme-default', 'theme-dark', 'theme-blue', 'theme-minimal');
            window.classList.add(`theme-${savedTheme}`);
        });
        
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === savedTheme) {
                option.classList.add('active');
            }
        });
    }
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
