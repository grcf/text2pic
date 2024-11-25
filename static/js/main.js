document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('text');
    const preview = document.getElementById('preview');
    const generateBtn = document.getElementById('generate');
    const downloadBtn = document.getElementById('download');
    const outputImg = document.getElementById('output');
    const resultDiv = document.getElementById('result');
    const copyBtn = document.getElementById('copy');
    const clearBtn = document.getElementById('clear');

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
    const themeToggleBtn = document.querySelector('.theme-toggle-btn');
    const macWindows = document.querySelectorAll('.mac-window');
    
    // 切换主题面板展开/收起
    themeToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        themeSwitcher.classList.toggle('expanded');
    });

    // 点击其他区域收起面板
    document.addEventListener('click', (e) => {
        if (!themeSwitcher.contains(e.target)) {
            themeSwitcher.classList.remove('expanded');
        }
    });

    // 主题切换功能
    const themeOptions = document.querySelector('.theme-options');
    themeOptions.addEventListener('click', (e) => {
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
            
            // 300ms 后自动收起面板
            setTimeout(() => {
                themeSwitcher.classList.remove('expanded');
            }, 300);
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

    // 设置当前年份
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // 修改清空按钮的点击事件处理
    clearBtn.addEventListener('click', function() {
        if (!editor.value.trim()) {
            return; // 如果已经是空的，直接返回
        }
        
        showConfirmDialog(
            '确定要清空所有内容吗？',
            '此操作无法撤销',
            () => {
                editor.value = '';
                updatePreview();
                
                // 隐藏结果区域
                resultDiv.classList.remove('show');
                setTimeout(() => {
                    resultDiv.style.display = 'none';
                    downloadBtn.classList.add('hidden');
                    copyBtn.classList.add('hidden');
                }, 300);
                
                // 重置输入框高度
                editor.style.height = 'auto';
            }
        );
    });

    // 添加自定义确认对话框函数
    function showConfirmDialog(title, message, onConfirm) {
        // 创建对话框元素
        const dialog = document.createElement('div');
        dialog.className = 'mac-dialog-overlay';
        dialog.innerHTML = `
            <div class="mac-dialog">
                <div class="mac-dialog-content">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="mac-dialog-buttons">
                        <button class="mac-style-button cancel-btn">取消</button>
                        <button class="mac-style-button primary confirm-btn">确定</button>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(dialog);
        
        // 添加动画类
        setTimeout(() => dialog.classList.add('show'), 10);

        // 绑定事件
        const cancelBtn = dialog.querySelector('.cancel-btn');
        const confirmBtn = dialog.querySelector('.confirm-btn');
        
        function closeDialog() {
            dialog.classList.remove('show');
            setTimeout(() => dialog.remove(), 300);
        }

        cancelBtn.addEventListener('click', closeDialog);
        confirmBtn.addEventListener('click', () => {
            onConfirm();
            closeDialog();
        });
        
        // 点击背景关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        });
        
        // ESC 键关闭
        document.addEventListener('keydown', function closeOnEsc(e) {
            if (e.key === 'Escape') {
                closeDialog();
                document.removeEventListener('keydown', closeOnEsc);
            }
        });
    }

    // 获取按钮元素
    const scrollTopBtn = document.querySelector('.scroll-top');
    const scrollBottomBtn = document.querySelector('.scroll-bottom');

    // 平滑滚动函数
    function smoothScroll(element, target, duration) {
        const start = element.scrollTop;
        const distance = target - start;
        const startTime = performance.now();

        function animation(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // easeInOutQuad 缓动函数
            const easing = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            element.scrollTop = start + (distance * easing);

            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }

        requestAnimationFrame(animation);
    }

    // 滚动到顶部
    scrollTopBtn.addEventListener('click', () => {
        smoothScroll(editor, 0, 300);
    });

    // 滚动到底部
    scrollBottomBtn.addEventListener('click', () => {
        smoothScroll(editor, editor.scrollHeight, 300);
    });

    // 监听滚动事件来控制按钮显示/隐藏
    editor.addEventListener('scroll', () => {
        const scrollButtons = document.querySelector('.scroll-buttons');
        
        // 只有当内容高度大于容器高度时才显示按钮
        if (editor.scrollHeight > editor.clientHeight) {
            scrollButtons.style.display = 'flex';
        } else {
            scrollButtons.style.display = 'none';
        }
    });

    // 初始化时检查是否需要显示按钮
    window.addEventListener('load', () => {
        const scrollButtons = document.querySelector('.scroll-buttons');
        if (editor.scrollHeight <= editor.clientHeight) {
            scrollButtons.style.display = 'none';
        }
    });

    // 获取所有滚动按钮元素
    const globalScrollTopBtn = document.querySelector('.global-scroll-top');
    const globalScrollBottomBtn = document.querySelector('.global-scroll-bottom');
    const previewScrollTopBtn = document.querySelector('.preview-scroll-top');
    const previewScrollBottomBtn = document.querySelector('.preview-scroll-bottom');
    const globalScrollButtons = document.querySelector('.global-scroll-buttons');

    // 平滑滚动函数（保持原有的）
    function smoothScroll(element, target, duration) {
        const start = element.scrollTop;
        const distance = target - start;
        const startTime = performance.now();

        function animation(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easing = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            element.scrollTop = start + (distance * easing);

            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }

        requestAnimationFrame(animation);
    }

    // 全局滚动按钮事件
    globalScrollTopBtn.addEventListener('click', () => {
        smoothScroll(document.documentElement, 0, 500);
    });

    globalScrollBottomBtn.addEventListener('click', () => {
        smoothScroll(document.documentElement, document.documentElement.scrollHeight, 500);
    });

    // 预览区域滚动按钮事件
    previewScrollTopBtn.addEventListener('click', () => {
        smoothScroll(preview, 0, 300);
    });

    previewScrollBottomBtn.addEventListener('click', () => {
        smoothScroll(preview, preview.scrollHeight, 300);
    });

    // 控制全局滚动按钮的显示/隐藏
    function toggleGlobalScrollButtons() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        if (scrollTop > windowHeight * 0.3 || documentHeight > windowHeight * 1.5) {
            globalScrollButtons.classList.add('show');
        } else {
            globalScrollButtons.classList.remove('show');
        }
    }

    // 监听滚动事件
    window.addEventListener('scroll', toggleGlobalScrollButtons);
    window.addEventListener('resize', toggleGlobalScrollButtons);

    // 初始化时检查是否需要显示全局滚动按钮
    document.addEventListener('DOMContentLoaded', toggleGlobalScrollButtons);

    // 监听预览区域的滚动事件
    preview.addEventListener('scroll', () => {
        const previewScrollButtons = document.querySelector('.preview-scroll-buttons');
        
        if (preview.scrollHeight > preview.clientHeight) {
            previewScrollButtons.style.display = 'flex';
        } else {
            previewScrollButtons.style.display = 'none';
        }
    });

    // 初始化时检查预览区域是否需要显示按钮
    window.addEventListener('load', () => {
        const previewScrollButtons = document.querySelector('.preview-scroll-buttons');
        if (preview.scrollHeight <= preview.clientHeight) {
            previewScrollButtons.style.display = 'none';
        }
    });

    // 宽度调整功能
    const previewContainer = document.querySelector('.bg-white.rounded-lg.shadow-lg.p-6:nth-child(2)');
    const widthInput = document.querySelector('.width-input');
    const decreaseBtn = document.querySelector('.width-button.decrease');
    const increaseBtn = document.querySelector('.width-button.increase');

    let currentWidth = 100;
    const minWidth = 50;
    const maxWidth = 150;
    const step = 10;

    function updatePreviewWidth(width) {
        currentWidth = Math.min(Math.max(width, minWidth), maxWidth);
        previewContainer.style.width = `${currentWidth}%`;
        previewContainer.style.transition = 'width 0.3s ease';
        widthInput.value = currentWidth;
        window.dispatchEvent(new Event('resize'));
    }

    decreaseBtn.addEventListener('click', () => {
        updatePreviewWidth(currentWidth - step);
    });

    increaseBtn.addEventListener('click', () => {
        updatePreviewWidth(currentWidth + step);
    });

    widthInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value);
        if (!isNaN(value)) {
            updatePreviewWidth(value);
        }
    });

    widthInput.addEventListener('blur', () => {
        if (widthInput.value === '' || isNaN(parseInt(widthInput.value))) {
            widthInput.value = currentWidth;
        }
    });

    // 初始化宽度
    updatePreviewWidth(currentWidth);
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
