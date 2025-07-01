export class CustomDropdown {
    constructor(container, options, initialValue = null) {
        this.container = container;
        this.options = options;
        this.value = initialValue;
        this.isOpen = false;
        
        // Create the button
        this.button = document.createElement('button');
        this.button.className = 'custom-dropdown-button';
        this.button.type = 'button';
        this.button.setAttribute('aria-haspopup', 'listbox');
        this.button.setAttribute('aria-expanded', 'false');
        
        // Create text span
        this.buttonText = document.createElement('span');
        this.buttonText.className = 'button-text';
        this.button.appendChild(this.buttonText);
        
        // Create arrow span
        this.arrow = document.createElement('span');
        this.arrow.className = 'dropdown-arrow';
        this.arrow.textContent = '▶';
        this.button.appendChild(this.arrow);
        
        // Create the dropdown content
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'custom-dropdown-content';
        this.dropdown.setAttribute('role', 'listbox');
        
        // Add options
        this.options.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'custom-dropdown-option';
            optionElement.setAttribute('role', 'option');
            optionElement.textContent = option.text;
            optionElement.dataset.value = option.value;
            
            if (option.value === initialValue) {
                optionElement.classList.add('selected');
                this.buttonText.textContent = option.text;
            }
            
            optionElement.addEventListener('click', () => {
                this.selectOption(option.value);
            });
            
            this.dropdown.appendChild(optionElement);
        });
        
        // Add click handler to button
        this.button.addEventListener('click', () => {
            this.toggleDropdown();
        });
        
        // Add click outside handler
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        // Add keyboard navigation
        this.button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleDropdown();
            }
        });
        
        this.dropdown.addEventListener('keydown', (e) => {
            const options = Array.from(this.dropdown.children);
            const currentIndex = options.findIndex(opt => opt.classList.contains('selected'));
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex < options.length - 1) {
                        this.selectOption(options[currentIndex + 1].dataset.value);
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        this.selectOption(options[currentIndex - 1].dataset.value);
                    }
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    this.closeDropdown();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.closeDropdown();
                    break;
            }
        });
        
        // Add elements to container
        this.container.appendChild(this.button);
        this.container.appendChild(this.dropdown);
        
        // Debug: Log final button state
        window.CONSOLE_LOG_IGNORE('Button after append:', this.button);
        window.CONSOLE_LOG_IGNORE('Button computed style:', window.getComputedStyle(this.button, '::after'));
    }
    
    selectOption(value) {
        const option = this.options.find(opt => opt.value === value);
        if (!option) return;
        
        this.value = value;
        this.buttonText.textContent = option.text;
        
        // Update selected state
        this.dropdown.querySelectorAll('.custom-dropdown-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.value === value);
        });
        
        // Dispatch change event
        this.container.dispatchEvent(new CustomEvent('change', {
            detail: { value }
        }));
        
        this.closeDropdown();
    }
    
    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    
    openDropdown() {
        this.isOpen = true;
        this.button.setAttribute('aria-expanded', 'true');
        this.dropdown.classList.add('open');
        this.arrow.textContent = '◀';
        this.arrow.style.transform = 'rotate(90deg)';
    }
    
    closeDropdown() {
        this.isOpen = false;
        this.button.setAttribute('aria-expanded', 'false');
        this.dropdown.classList.remove('open');
        this.arrow.textContent = '▶';
        this.arrow.style.transform = 'none';
    }
    
    getValue() {
        return this.value;
    }
    
    setValue(value) {
        this.selectOption(value);
    }
} 