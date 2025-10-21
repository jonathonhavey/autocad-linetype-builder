// AutoCAD Line Type Builder
class LineTypeBuilder {
    constructor() {
        this.elements = [];
        this.init();
    }

    init() {
        console.log('AutoCAD Line Type Builder loaded!');
        
        // Constants
        this.MIN_ELEMENTS = 2;
        this.MAX_ELEMENTS = 12;
        this.showTextGuides = false;
        // Preview shape
        this.currentShape = 'line';
        
        // Line weight
        this.lineWeight = 1.0;
        
        // Preview navigation
        this.zoomLevel = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Debug helpers
        this.showTextGuides = false;
        
        // Circle preview settings
        this.minCircleRadius = 0.8 * 200; // Fixed minimum radius: 0.8 AutoCAD units = 160 pixels
        
        // DOM elements
        this.cardsContainer = document.getElementById('cardsContainer');
        this.linetypeName = document.getElementById('linetypeName');
        this.linetypeDesc = document.getElementById('linetypeDesc');
        this.outputCode = document.getElementById('outputCode');
        this.copyCodeBtn = document.getElementById('copyCodeBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.previewCanvas = null;
        
        // Event listeners
        this.copyCodeBtn.addEventListener('click', () => this.copyCode());
        this.downloadBtn.addEventListener('click', () => this.downloadLinFile());
        
        // Input listeners for real-time updates
        this.linetypeName.addEventListener('input', () => this.updateOutput());
        this.linetypeDesc.addEventListener('input', () => this.updateOutput());
        
        // Initialize with default elements
        this.initializeDefaultElements();
        this.updateOutput();
        this.updatePreview();
        
        // Set initial view to zoom extents
        setTimeout(() => {
            this.zoomExtents();
        }, 100); // Small delay to ensure canvas is ready
    }

    initializeDefaultElements() {
        // Create default pattern: A,1,-0.5,["TEXT",STANDARD,S=0.1,R=0,X=-0.2,Y=-0.05],-0.5
        const element1 = {
            id: Date.now(),
            type: 'dash',
            value: 1.0  // A,1 - visible dash
        };
        
        const element2 = {
            id: Date.now() + 1,
            type: 'dash', 
            value: -0.5  // -0.5 gap
        };
        
        const element3 = {
            id: Date.now() + 2,
            type: 'text',
            value: {
                text: 'TEXT',
                style: 'STANDARD',
                scale: 0.1,
                rotationType: 'U',
                rotationAngle: 0,
                xOffset: -0.2,
                yOffset: -0.05
            }
        };
        
        const element4 = {
            id: Date.now() + 3,
            type: 'dash',
            value: -0.5  // -0.5 gap
        };
        
        this.elements.push(element1, element2, element3, element4);
        this.renderCards();
    }

    showEmptyState() {
        this.cardsContainer.innerHTML = `
            <div class="empty-state">
                <p>No elements in line type</p>
                <p>AutoCAD line types require a minimum of ${this.MIN_ELEMENTS} elements and maximum of ${this.MAX_ELEMENTS}</p>
                <p>Available elements: Dash, Dot, Text</p>
            </div>
        `;
    }



    addElement(type) {
        if (this.elements.length >= this.MAX_ELEMENTS) {
            return;
        }
        
        const element = {
            id: Date.now(),
            type: type,
            value: this.getDefaultValue(type)
        };
        
        this.elements.push(element);
        this.renderCards();
        this.updateOutput();
    }

    getDefaultValue(type) {
        switch(type) {
            case 'dash': return 0.5;
            case 'dot': return 0;
            case 'text': return {
                text: 'TEXT',
                style: 'STANDARD',
                scale: 0.1,
                rotationType: 'U',
                rotationAngle: 0.0,
                xOffset: 0,
                yOffset: -0.05
            };
            default: return null;
        }
    }

    renderCards() {
        if (this.elements.length === 0) {
            this.showEmptyState();
            return;
        }

        this.cardsContainer.innerHTML = '';
        
        // Create a flex container that handles wrapping
        const cardsGrid = document.createElement('div');
        cardsGrid.className = 'cards-grid';
        
        // Add initial plus button (to insert at position 0)
        const initialPlusBtn = this.createPlusButton(0);
        cardsGrid.appendChild(initialPlusBtn);
        
        // Add cards with plus buttons between them
        this.elements.forEach((element, index) => {
            // Add the card
            const card = this.createElementCard(element, index);
            cardsGrid.appendChild(card);
            
            // Add plus button after this card (to insert at position index + 1)
            const plusBtn = this.createPlusButton(index + 1);
            cardsGrid.appendChild(plusBtn);
        });
        
        this.cardsContainer.appendChild(cardsGrid);
    }

    createElementCard(element, index) {
        const card = document.createElement('div');
        card.className = `element-card ${element.type}-card`;
        card.dataset.elementId = element.id;
        card.dataset.index = index;
        
        let cardContent = '';
        
        switch(element.type) {
            case 'dash':
                const isVisible = element.value >= 0;
                const length = Math.abs(element.value);
                cardContent = `
                    <div class="card-header">
                        <div class="drag-handle" title="Drag to reorder">⋮⋮</div>
                        <select class="card-type-selector" onchange="lineTypeBuilder.changeElementType(${element.id}, this.value)">
                            <option value="dash" selected>Dash</option>
                            <option value="dot">Dot</option>
                            <option value="text">Text</option>
                        </select>
                        <button onclick="lineTypeBuilder.removeElement(${element.id})" class="remove-btn">×</button>
                    </div>
                    <div class="card-content">
                        <div class="control-group">
                            <label>Length</label>
                            <div class="number-input">
                                <input type="number" 
                                       value="${length}" 
                                       min="0" 
                                       step="0.01" 
                                       class="length-input"
                                       onchange="lineTypeBuilder.updateDashLength(${element.id}, this.value)"
                                       oninput="lineTypeBuilder.updateDashLengthLive(${element.id}, this.value)">
                                <div class="number-buttons">
                                    <button type="button" class="number-btn up-btn" onclick="lineTypeBuilder.incrementLength(${element.id}, 0.01)">▲</button>
                                    <button type="button" class="number-btn down-btn" onclick="lineTypeBuilder.incrementLength(${element.id}, -0.01)">▼</button>
                                </div>
                            </div>
                        </div>
                        <div class="control-group">
                            <label class="checkbox-label">
                                <input type="checkbox" 
                                       ${isVisible ? 'checked' : ''} 
                                       onchange="lineTypeBuilder.updateDashVisibility(${element.id}, this.checked)">
                                <span>Visible</span>
                            </label>
                        </div>
                    </div>
                `;
                break;
            case 'dot':
                cardContent = `
                    <div class="card-header">
                        <div class="drag-handle" title="Drag to reorder">⋮⋮</div>
                        <select class="card-type-selector" onchange="lineTypeBuilder.changeElementType(${element.id}, this.value)">
                            <option value="dash">Dash</option>
                            <option value="dot" selected>Dot</option>
                            <option value="text">Text</option>
                        </select>
                        <button onclick="lineTypeBuilder.removeElement(${element.id})" class="remove-btn">×</button>
                    </div>
                `;
                break;
            case 'text':
                cardContent = `
                    <div class="card-header">
                        <div class="drag-handle" title="Drag to reorder">⋮⋮</div>
                        <select class="card-type-selector" onchange="lineTypeBuilder.changeElementType(${element.id}, this.value)">
                            <option value="dash">Dash</option>
                            <option value="dot">Dot</option>
                            <option value="text" selected>Text</option>
                        </select>
                        <button onclick="lineTypeBuilder.removeElement(${element.id})" class="remove-btn">×</button>
                    </div>
                    <div class="card-content">
                        <div class="control-group">
                            <div class="text-label-row">
                                <label>Text</label>
                                <div class="text-helper-buttons">
                                    <button type="button" class="case-btn" onclick="lineTypeBuilder.changeTextCase(${element.id}, 'upper')" title="Convert to uppercase">ABC</button>
                                    <button type="button" class="case-btn" onclick="lineTypeBuilder.changeTextCase(${element.id}, 'lower')" title="Convert to lowercase">abc</button>
                                </div>
                            </div>
                            <input type="text" 
                                   value="${element.value.text}" 
                                   class="text-input"
                                   onchange="lineTypeBuilder.updateTextProperty(${element.id}, 'text', this.value)"
                                   oninput="lineTypeBuilder.updateTextProperty(${element.id}, 'text', this.value)">
                        </div>
                        <div class="control-row">
                            <div class="control-group half-width">
                                <label>Scale</label>
                                <div class="number-input">
                                    <input type="number" 
                                           value="${element.value.scale}" 
                                           min="0" 
                                           step="0.01" 
                                           class="scale-input"
                                           onchange="lineTypeBuilder.updateTextProperty(${element.id}, 'scale', this.value)"
                                           oninput="lineTypeBuilder.updateTextProperty(${element.id}, 'scale', this.value)">
                                    <div class="number-buttons">
                                        <button type="button" class="number-btn up-btn" onclick="lineTypeBuilder.incrementTextProperty(${element.id}, 'scale', 0.01)">▲</button>
                                        <button type="button" class="number-btn down-btn" onclick="lineTypeBuilder.incrementTextProperty(${element.id}, 'scale', -0.01)">▼</button>
                                    </div>
                                </div>
                            </div>
                            <div class="control-group half-width">
                                <label>Rotation</label>
                                <div class="rotation-row">
                                    <select class="rotation-type-select" 
                                            onchange="lineTypeBuilder.updateTextRotationType(${element.id}, this.value)"
                                            title="U = Upright/easy-to-read text&#10;R = Relative/tangential rotation with respect to the line&#10;A = Absolute rotation with respect to origin">
                                        <option value="R" ${(element.value.rotationType || 'R') === 'R' ? 'selected' : ''}>R</option>
                                        <option value="U" ${element.value.rotationType === 'U' ? 'selected' : ''}>U</option>
                                        <option value="A" ${element.value.rotationType === 'A' ? 'selected' : ''}>A</option>
                                    </select>
                                    <div class="number-input rotation-angle" style="display: flex">
                                        <input type="number" 
                                               value="${element.value.rotationAngle || 0}" 
                                               step="0.1" 
                                               class="angle-input"
                                               onchange="lineTypeBuilder.updateTextProperty(${element.id}, 'rotationAngle', this.value)"
                                               oninput="lineTypeBuilder.updateTextProperty(${element.id}, 'rotationAngle', this.value)">
                                        <div class="number-buttons">
                                            <button type="button" class="number-btn up-btn" onclick="lineTypeBuilder.incrementTextProperty(${element.id}, 'rotationAngle', 0.1)">▲</button>
                                            <button type="button" class="number-btn down-btn" onclick="lineTypeBuilder.incrementTextProperty(${element.id}, 'rotationAngle', -0.1)">▼</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="control-group">
                            <div class="offset-label-row">
                                <label>Offset</label>
                                <button type="button" class="center-btn" onclick="lineTypeBuilder.centerText(${element.id})" title="Center text on line">Center</button>
                            </div>
                            <div class="offset-row">
                                <div class="offset-group">
                                    <span class="offset-label">X:</span>
                                    <div class="number-input">
                                        <input type="number" 
                                               value="${element.value.xOffset}" 
                                               step="0.01" 
                                               class="offset-input"
                                               onchange="lineTypeBuilder.updateTextProperty(${element.id}, 'xOffset', this.value)"
                                               oninput="lineTypeBuilder.updateTextProperty(${element.id}, 'xOffset', this.value)">
                                        <div class="number-buttons">
                                            <button type="button" class="number-btn up-btn" onclick="lineTypeBuilder.incrementTextProperty(${element.id}, 'xOffset', 0.01)">▲</button>
                                            <button type="button" class="number-btn down-btn" onclick="lineTypeBuilder.incrementTextProperty(${element.id}, 'xOffset', -0.01)">▼</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="offset-group">
                                    <span class="offset-label">Y:</span>
                                    <div class="number-input">
                                        <input type="number" 
                                               value="${element.value.yOffset}" 
                                               step="0.01" 
                                               class="offset-input"
                                               onchange="lineTypeBuilder.updateTextProperty(${element.id}, 'yOffset', this.value)"
                                               oninput="lineTypeBuilder.updateTextProperty(${element.id}, 'yOffset', this.value)">
                                        <div class="number-buttons">
                                            <button type="button" class="number-btn up-btn" onclick="lineTypeBuilder.incrementTextProperty(${element.id}, 'yOffset', 0.01)">▲</button>
                                            <button type="button" class="number-btn down-btn" onclick="lineTypeBuilder.incrementTextProperty(${element.id}, 'yOffset', -0.01)">▼</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="control-group">
                            <label>Style</label>
                            <input type="text" 
                                   value="${element.value.style}" 
                                   class="style-input"
                                   onchange="lineTypeBuilder.updateTextProperty(${element.id}, 'style', this.value)"
                                   oninput="lineTypeBuilder.updateTextProperty(${element.id}, 'style', this.value)">
                        </div>
                    </div>
                `;
                break;
        }
        
        card.innerHTML = cardContent;
        
        // Add drag and drop event listeners only to the drag handle
        const dragHandle = card.querySelector('.drag-handle');
        dragHandle.draggable = true;
        dragHandle.addEventListener('dragstart', (e) => this.handleDragStart(e));
        dragHandle.addEventListener('dragend', (e) => this.handleDragEnd(e));
        
        // Add drop zone listeners to the card (for receiving drops)
        card.addEventListener('dragover', (e) => this.handleDragOver(e));
        card.addEventListener('drop', (e) => this.handleDrop(e));
        card.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        card.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        
        // Add click and hold functionality to number buttons
        const numberButtons = card.querySelectorAll('.number-btn');
        numberButtons.forEach(button => {
            this.addClickAndHold(button);
        });
        
        return card;
    }

    createPlusButton(insertPosition) {
        const plusBtn = document.createElement('button');
        plusBtn.className = 'plus-button';
        plusBtn.innerHTML = '+';
        plusBtn.title = `Insert element at position ${insertPosition + 1}`;
        
        // Disable if at maximum elements
        if (this.elements.length >= this.MAX_ELEMENTS) {
            plusBtn.disabled = true;
            plusBtn.title = `Maximum ${this.MAX_ELEMENTS} elements reached`;
        }
        
        plusBtn.addEventListener('click', () => {
            if (this.elements.length < this.MAX_ELEMENTS) {
                this.insertElement(insertPosition);
            }
        });
        
        return plusBtn;
    }

    insertElement(position) {
        if (this.elements.length >= this.MAX_ELEMENTS) {
            this.showNotification(`Maximum of ${this.MAX_ELEMENTS} elements allowed`);
            return;
        }
        
        const element = {
            id: Date.now(),
            type: 'dash',
            value: this.getDefaultValue('dash')
        };
        
        // Insert at specified position
        this.elements.splice(position, 0, element);
        this.renderCards();
        this.updateOutput();
    }

    removeElement(id) {
        // Prevent removing if it would go below minimum
        if (this.elements.length <= this.MIN_ELEMENTS && this.elements.length > 0) {
            this.showNotification(`Minimum of ${this.MIN_ELEMENTS} elements required`);
            return;
        }
        
        this.elements = this.elements.filter(element => element.id !== id);
        this.renderCards();
        this.updateOutput();
    }

    changeElementType(id, newType) {
        const elementIndex = this.elements.findIndex(element => element.id === id);
        if (elementIndex !== -1) {
            this.elements[elementIndex].type = newType;
            this.elements[elementIndex].value = this.getDefaultValue(newType);
            this.renderCards();
            this.updateOutput();
        }
    }

    updateDashLength(id, length) {
        const elementIndex = this.elements.findIndex(element => element.id === id);
        if (elementIndex !== -1) {
            const element = this.elements[elementIndex];
            const numericLength = Math.abs(parseFloat(length) || 0);
            // Maintain visibility state while updating length
            const wasVisible = element.value >= 0;
            element.value = wasVisible ? numericLength : -numericLength;
            
            // Re-render cards to update UI and call updateOutput
            this.renderCards();
            this.updateOutput();
        }
    }

    updateDashLengthLive(id, length) {
        const elementIndex = this.elements.findIndex(element => element.id === id);
        if (elementIndex !== -1) {
            const element = this.elements[elementIndex];
            
            // Don't update if user is typing a decimal (like "." or starts with ".")
            if (length === '.' || length === '' || isNaN(parseFloat(length))) {
                return; // Skip update while typing incomplete decimal
            }
            
            const numericLength = Math.abs(parseFloat(length));
            // Maintain visibility state while updating length
            const wasVisible = element.value >= 0;
            element.value = wasVisible ? numericLength : -numericLength;
            
            // Only update output, don't re-render cards while typing
            this.updateOutput();
        }
    }

    updateDashVisibility(id, isVisible) {
        const elementIndex = this.elements.findIndex(element => element.id === id);
        if (elementIndex !== -1) {
            const element = this.elements[elementIndex];
            const length = Math.abs(element.value);
            // Set positive for visible, negative for gap
            element.value = isVisible ? length : -length;
            this.renderCards();
            this.updateOutput();
        }
    }

    incrementLength(id, increment) {
        const elementIndex = this.elements.findIndex(element => element.id === id);
        if (elementIndex !== -1) {
            const element = this.elements[elementIndex];
            const currentLength = Math.abs(element.value);
            const newLength = Math.max(0, Math.round((currentLength + increment) * 100) / 100); // Round to 2 decimals
            
            // Maintain visibility state while updating length
            element.value = element.value >= 0 ? newLength : -newLength;
            
            // Update the input field directly instead of re-rendering
            const card = document.querySelector(`[data-element-id="${id}"]`);
            const lengthInput = card?.querySelector('.length-input');
            if (lengthInput) {
                lengthInput.value = Math.abs(element.value);
            }
            
            this.updateOutput();
        }
    }

    updateTextProperty(id, property, value) {
        const elementIndex = this.elements.findIndex(element => element.id === id);
        if (elementIndex !== -1) {
            const element = this.elements[elementIndex];
            if (property === 'scale' || property === 'xOffset' || property === 'yOffset' || property === 'rotationAngle') {
                element.value[property] = parseFloat(value) || 0;
            } else {
                element.value[property] = value;
            }
            this.updateOutput();
        }
    }

    updateTextRotationType(id, rotationType) {
        const elementIndex = this.elements.findIndex(element => element.id === id);
        if (elementIndex !== -1) {
            const element = this.elements[elementIndex];
            element.value.rotationType = rotationType;
            
            // Initialize rotation angle if not set (needed for all rotation types)
            if (element.value.rotationAngle === undefined) {
                element.value.rotationAngle = 0.0;
            }
            
            this.renderCards();
            this.updateOutput();
        }
    }

    changeTextCase(id, caseType) {
        const elementIndex = this.elements.findIndex(element => element.id === id);
        if (elementIndex !== -1) {
            const element = this.elements[elementIndex];
            let newText = element.value.text;
            
            if (caseType === 'upper') {
                newText = newText.toUpperCase();
            } else if (caseType === 'lower') {
                newText = newText.toLowerCase();
            }
            
            element.value.text = newText;
            
            // Update the input field directly
            const card = document.querySelector(`[data-element-id="${id}"]`);
            const textInput = card?.querySelector('.text-input');
            if (textInput) {
                textInput.value = newText;
            }
            
            this.updateOutput();
        }
    }

    centerText(id) {
        const elementIndex = this.elements.findIndex(element => element.id === id);
        if (elementIndex !== -1) {
            const element = this.elements[elementIndex];
            
            // Calculate text dimensions
            const textDimensions = this.calculateTextDimensions(element.value);
            
            // Calculate centering offsets (AutoCAD coordinate system)
            // X offset: negative moves left, so -width/2 centers horizontally
            const xOffset = -textDimensions.width / 2;
            
            // Y offset: With alphabetic baseline, text sits on line at Y=0
            // To center vertically, we need to move DOWN by half the text height
            // Negative Y moves down in AutoCAD, so we use negative value
            const yOffset = -textDimensions.height / 2;
            
            // Update the element values
            element.value.xOffset = Math.round(xOffset * 100) / 100;
            element.value.yOffset = Math.round(yOffset * 100) / 100;
            
            // Update the input fields directly
            const card = document.querySelector(`[data-element-id="${id}"]`);
            const offsetInputs = card?.querySelectorAll('.offset-input');
            if (offsetInputs?.[0]) {
                offsetInputs[0].value = element.value.xOffset;
            }
            if (offsetInputs?.[1]) {
                offsetInputs[1].value = element.value.yOffset;
            }
            
            this.updateOutput();
        }
    }

    calculateTextDimensions(textValue) {
        // Create a temporary canvas to measure text dimensions
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set font properties based on text scale and style
        // AutoCAD standard text height is typically the scale value
        // Compensate for actual text height being ~70% of font-size
        const fontSize = textValue.scale * 200 * 1.4; // Adjusted for actual text height
        
        // Map AutoCAD text styles to web fonts (approximation)
        let fontFamily = 'Arial';
        switch(textValue.style?.toUpperCase()) {
            case 'ROMANS':
            case 'ROMANTIC':
                fontFamily = 'Times New Roman';
                break;
            case 'MONOTXT':
                fontFamily = 'Courier New';
                break;
            case 'STANDARD':
            default:
                fontFamily = 'Arial';
                break;
        }
        
        ctx.font = `${fontSize}px ${fontFamily}`;
        
        // Measure the text
        const metrics = ctx.measureText(textValue.text);
        
        // Calculate dimensions
        // metrics.width is in pixels, convert to AutoCAD units (1 unit = 200px)
        const width = metrics.width / 200; // Convert pixels to AutoCAD units
        const height = textValue.scale; // Text height is typically equal to scale
        
        return {
            width: width,
            height: height
        };
    }

    initPreviewCanvas() {
        if (this.previewCanvas) return;
        
        const previewContainer = document.querySelector('.preview-content');
        if (!previewContainer) return;
        
        // Create canvas element
        this.previewCanvas = document.createElement('canvas');
        this.previewCanvas.width = previewContainer.clientWidth;
        this.previewCanvas.height = previewContainer.clientHeight;
        this.previewCanvas.style.position = 'absolute';
        this.previewCanvas.style.top = '0';
        this.previewCanvas.style.left = '0';
        this.previewCanvas.style.zIndex = '10';
        this.previewCanvas.style.cursor = 'grab';
        
        // Add navigation event listeners
        this.setupPreviewNavigation();
        
        previewContainer.appendChild(this.previewCanvas);
    }

    setupPreviewNavigation() {
        const canvas = this.previewCanvas;
        
        // Mouse wheel zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Zoom towards mouse position
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(0.1, Math.min(10, this.zoomLevel * zoomFactor));
            
            // Adjust pan to zoom towards mouse
            const zoomChange = newZoom / this.zoomLevel;
            this.panX = mouseX - (mouseX - this.panX) * zoomChange;
            this.panY = mouseY - (mouseY - this.panY) * zoomChange;
            
            this.zoomLevel = newZoom;
            this.updatePreview();
        });
        
        // Mouse drag panning
        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            canvas.style.cursor = 'grabbing';
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                this.panX += deltaX;
                this.panY += deltaY;
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                
                this.updatePreview();
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            canvas.style.cursor = 'grab';
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            canvas.style.cursor = 'grab';
        });
        
        // Double-click to zoom extents
        canvas.addEventListener('dblclick', () => {
            this.zoomExtents();
        });
    }

    changePreviewShape(shape) {
        this.currentShape = shape;
        this.updatePreview();
        // Auto zoom to extents when shape changes
        setTimeout(() => {
            this.zoomExtents();
        }, 50);
    }

    changeLineWeight(value) {
        this.lineWeight = parseFloat(value);
        // Update the display value
        const valueDisplay = document.getElementById('lineWeightValue');
        if (valueDisplay) {
            valueDisplay.textContent = this.lineWeight.toFixed(1);
        }
        // Refresh the preview
        this.updatePreview();
    }

    getCircleRadiusInUnits() {
        // Return the current minimum radius in AutoCAD units (fixed at 0.8)
        return 0.8;
    }

    zoomIn() {
        this.zoomLevel = Math.min(10, this.zoomLevel * 1.2);
        this.updatePreview();
    }

    zoomOut() {
        this.zoomLevel = Math.max(0.1, this.zoomLevel / 1.2);
        this.updatePreview();
    }

    zoomExtents() {
        if (!this.previewCanvas) return;
        
        // Calculate the bounds of the current shape
        const bounds = this.calculateShapeBounds();
        
        if (!bounds) {
            // Fallback to default view if no bounds
            this.zoomLevel = 1.0;
            this.panX = 0;
            this.panY = 0;
            this.updatePreview();
            return;
        }
        
        const canvas = this.previewCanvas;
        const margin = 40; // pixels of margin around the shape
        
        // Calculate required zoom to fit the shape with margin
        const availableWidth = canvas.width - 2 * margin;
        const availableHeight = canvas.height - 2 * margin;
        
        const zoomX = availableWidth / bounds.width;
        const zoomY = availableHeight / bounds.height;
        
        // Use the smaller zoom to ensure everything fits
        this.zoomLevel = Math.min(zoomX, zoomY, 10); // Cap at max zoom of 10
        this.zoomLevel = Math.max(this.zoomLevel, 0.1); // Ensure minimum zoom of 0.1
        
        // Calculate pan to center the shape
        const shapeCenterX = bounds.left + bounds.width / 2;
        const shapeCenterY = bounds.top + bounds.height / 2;
        const canvasCenterX = canvas.width / 2;
        const canvasCenterY = canvas.height / 2;

        this.panX = canvasCenterX - (shapeCenterX * this.zoomLevel);
        this.panY = canvasCenterY - (shapeCenterY * this.zoomLevel);
        
        this.updatePreview();
    }

    calculateShapeBounds() {
        const patternLength = this.calculatePatternLength();
        if (patternLength <= 0) return null;
        
        const scale = 200; // 200 pixels per AutoCAD unit
        
        switch (this.currentShape) {
            case 'line':
                // Line bounds - use a simpler approach that matches grid coordinates
                // Line is positioned at Y=0 in the grid coordinate system
                const patternWidthPx = patternLength * scale;
                const repetitions = Math.max(1, 8); // Show at least 8 repetitions for good view
                const lineWidth = repetitions * patternWidthPx;
                
                // Check if there are text elements that might extend bounds
                let maxTextHeight = 0;
                for (const element of this.elements) {
                    if (element.type === 'text') {
                        const textHeight = Math.abs(element.value.yOffset) + element.value.scale;
                        maxTextHeight = Math.max(maxTextHeight, textHeight);
                    }
                }
                
                const textMargin = maxTextHeight * scale;
                const totalHeight = Math.max(40, textMargin * 2); // At least 40px, or account for text
                
                return {
                    left: 0,
                    top: -totalHeight / 2, // Center around Y=0
                    width: lineWidth,
                    height: totalHeight
                };
                
            case 'rectangle':
                // Rectangle bounds - use the same calculation as rendering
                const firstElementLength = this.calculateFirstElementLength();
                const rectWidthUnits = (3 * patternLength) + firstElementLength;
                const rectHeightUnits = (2 * patternLength) + firstElementLength;
                const minSizeUnits = 0.8;
                
                const rectWidth = Math.max(minSizeUnits, rectWidthUnits) * scale;
                const rectHeight = Math.max(minSizeUnits, rectHeightUnits) * scale;
                
                return {
                    left: 0,
                    top: 0,
                    width: rectWidth,
                    height: rectHeight
                };
                
            case 'circle':
                // Circle bounds
                const minRadiusPx = this.minCircleRadius;
                const totalPatternLength = 6 * patternLength;
                const circumference = totalPatternLength * scale;
                const calculatedRadius = circumference / (2 * Math.PI);
                const radius = Math.max(calculatedRadius, minRadiusPx);
                
                return {
                    left: -radius,
                    top: -radius,
                    width: 2 * radius,
                    height: 2 * radius
                };
                
            case 'triangle':
                // Triangle bounds - equilateral triangle with bottom left at (0,0)
                const firstElementLengthTri = this.calculateFirstElementLength();
                const baseSideUnits = (2 * patternLength) + firstElementLengthTri;
                const minSizeUnitsTri = 0.8;
                
                const baseSideLength = Math.max(minSizeUnitsTri, baseSideUnits) * scale;
                const triangleHeight = (Math.sqrt(3) / 2) * baseSideLength;
                
                return {
                    left: 0,
                    top: 0,
                    width: baseSideLength,
                    height: triangleHeight
                };
                
            default:
                // Default bounds for other shapes
                return {
                    left: 0,
                    top: 0,
                    width: 400,
                    height: 200
                };
        }
    }

    toggleTextGuides() {
        this.showTextGuides = !this.showTextGuides;
        this.updatePreview();
        this.showNotification(`Text guides ${this.showTextGuides ? 'enabled' : 'disabled'}`);
    }

    // Import Bar Functions
    toggleImportBar() {
        const importBar = document.getElementById('importBar');
        const isVisible = importBar.style.display !== 'none';
        
        if (isVisible) {
            importBar.style.display = 'none';
        } else {
            importBar.style.display = 'block';
            document.getElementById('importInput').focus();
        }
    }

    closeImportBar() {
        document.getElementById('importBar').style.display = 'none';
        document.getElementById('importInput').value = '';
    }

    // Import from pasted text
    importFromText() {
        const input = document.getElementById('importInput');
        const definition = input.value.trim();
        
        if (!definition) {
            alert('Please paste a line type definition');
            return;
        }

        try {
            // Clear existing elements
            this.elements = [];
            
            // Handle both single line and multi-line formats
            let nameDesc = '';
            let lineCode = '';
            
            // Check if it's a single line with just the definition (A,1,-0.5,0.25,-0.5)
            if (definition.startsWith('A,') || definition.match(/^\d/)) {
                lineCode = definition;
                console.log('Single line definition detected:', lineCode);
            } else {
                // Multi-line or complex format - parse for name/description and line code
                
                // Look for description line (starts with *)
                const descMatch = definition.match(/\*([^,\r\n]+),([^\r\nA]*)/);
                if (descMatch) {
                    const lineName = descMatch[1].trim();
                    const lineDesc = descMatch[2].trim();
                    this.linetypeName.value = lineName;
                    this.linetypeDesc.value = lineDesc;
                    console.log('Set name:', lineName, 'description:', lineDesc);
                }
                
                // Look for line code (starts with A, or comes after the description)
                const codeMatch = definition.match(/A,([^\r\n]*)/);
                if (codeMatch) {
                    lineCode = 'A,' + codeMatch[1];
                    console.log('Found line code:', lineCode);
                } else {
                    // If no A, found, look for pattern after description or at end
                    const afterDesc = definition.replace(/\*[^\r\n]*[\r\n]*/, '').trim();
                    if (afterDesc && (afterDesc.match(/^[\d\-\.,\[\]]/) || afterDesc.startsWith('A,'))) {
                        lineCode = afterDesc;
                        console.log('Found line code after description:', lineCode);
                    }
                }
            }
            
            // Parse the line code if we found one
            if (lineCode) {
                console.log('Processing line code:', lineCode);
                this.parseLineTypeDefinition(lineCode);
            } else {
                throw new Error('No valid line type definition found');
            }
            
            // Update UI
            this.renderCards();
            this.updatePreview();
            this.updateOutput();
            
            this.closeImportBar();
        } catch (error) {
            alert('Error importing line type: ' + error.message);
        }
    }

    // Parse line type definition string 
    parseLineTypeDefinition(definition) {
        console.log('parseLineTypeDefinition called with:', definition);
        
        // Skip if this is a description line
        if (definition.startsWith('*')) {
            return;
        }
        
        // Remove 'A,' prefix if present
        let startIndex = 0;
        if (definition.startsWith('A,')) {
            startIndex = 2;
        }
        
        // Get the actual definition part
        const actualDefinition = definition.substring(startIndex);
        
        let parts = [];
        let currentPart = '';
        let inBrackets = false;
        
        for (let i = 0; i < actualDefinition.length; i++) {
            const char = actualDefinition[i];
            
            if (char === '[') {
                inBrackets = true;
                currentPart += char;
            } else if (char === ']') {
                inBrackets = false;
                currentPart += char;
            } else if (char === ',' && !inBrackets) {
                if (currentPart.trim()) {
                    parts.push(currentPart.trim());
                }
                currentPart = '';
            } else {
                currentPart += char;
            }
        }
        
        // Add the last part
        if (currentPart.trim()) {
            parts.push(currentPart.trim());
        }

        console.log('Parsed parts:', parts);

        // Process each part
        for (let part of parts) {
            part = part.trim();
            if (!part) continue;

            console.log('Processing part:', part);
            if (part.startsWith('[') && part.endsWith(']')) {
                // Text element
                console.log('Creating text element from:', part);
                this.parseTextElement(part);
            } else {
                // Dash element
                console.log('Creating dash element from:', part);
                this.parseDashElement(part);
            }
        }
        
        console.log('Final elements array:', this.elements);
    }

    // Parse text element from brackets
    parseTextElement(textPart) {
        // Remove brackets and split by commas
        const content = textPart.substring(1, textPart.length - 1);
        const parts = content.split(',');
        
        if (parts.length < 2) return;

        const text = parts[0].replace(/"/g, ''); // Remove quotes
        const style = parts[1] || 'STANDARD';
        
        // Parse remaining parameters
        let scale = 0.1, rotationType = 'R', rotationAngle = 0, xOffset = 0, yOffset = 0;
        
        for (let i = 2; i < parts.length; i++) {
            const param = parts[i].trim();
            if (param.startsWith('S=')) {
                scale = parseFloat(param.substring(2)) || 0.1;
            } else if (param.startsWith('R=')) {
                rotationAngle = parseFloat(param.substring(2)) || 0;
            } else if (param.startsWith('X=')) {
                xOffset = parseFloat(param.substring(2)) || 0;
            } else if (param.startsWith('Y=')) {
                yOffset = parseFloat(param.substring(2)) || 0;
            } else if (param === 'A' || param === 'R' || param === 'U') {
                rotationType = param;
                rotationAngle = 0; // Reset angle if type is specified
            } else if (param.includes('=')) {
                // Handle combined parameters like "U=0"
                const [type, angle] = param.split('=');
                if (['A', 'R', 'U'].includes(type)) {
                    rotationType = type;
                    rotationAngle = parseFloat(angle) || 0;
                }
            }
        }

        // Create text element
        const element = {
            id: Date.now() + Math.random(), // Unique ID
            type: 'text',
            value: {
                text: text,
                style: style,
                scale: scale,
                rotationType: rotationType,
                rotationAngle: rotationAngle,
                xOffset: xOffset,
                yOffset: yOffset
            }
        };

        this.elements.push(element);
    }

    // Parse dash element
    parseDashElement(dashPart) {
        const length = parseFloat(dashPart);
        if (isNaN(length)) return;

        // Determine if it's a dash or dot based on the value
        const type = (length === 0) ? 'dot' : 'dash';

        const element = {
            id: Date.now() + Math.random(), // Unique ID
            type: type,
            value: length
        };

        this.elements.push(element);
    }

    drawGrid(ctx, canvas) {
        // Grid represents AutoCAD units: each grid square = 0.1 units, rendered as 20px
        const gridSpacing = 20; // pixels per 0.1 unit
        const gridColor = '#e0e0e0';
        const majorGridColor = '#c0c0c0';
        
        // Calculate visible area in transformed space
        const invZoom = 1 / this.zoomLevel;
        const visibleLeft = -this.panX * invZoom;
        const visibleTop = -this.panY * invZoom;
        const visibleRight = visibleLeft + canvas.width * invZoom;
        const visibleBottom = visibleTop + canvas.height * invZoom;
        
        // Calculate grid line bounds
        const startX = Math.floor(visibleLeft / gridSpacing) * gridSpacing;
        const startY = Math.floor(visibleTop / gridSpacing) * gridSpacing;
        const endX = Math.ceil(visibleRight / gridSpacing) * gridSpacing;
        const endY = Math.ceil(visibleBottom / gridSpacing) * gridSpacing;
        
        ctx.lineWidth = 1 / this.zoomLevel; // Keep lines same thickness regardless of zoom
        
        // Draw minor grid lines (every 0.1 unit)
        ctx.strokeStyle = gridColor;
        ctx.beginPath();
        
        // Vertical lines
        for (let x = startX; x <= endX; x += gridSpacing) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        
        // Horizontal lines
        for (let y = startY; y <= endY; y += gridSpacing) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        
        ctx.stroke();
        
        // Draw major grid lines (every 1.0 unit = every 10 minor grid lines)
        const majorSpacing = gridSpacing * 10;
        const majorStartX = Math.floor(visibleLeft / majorSpacing) * majorSpacing;
        const majorStartY = Math.floor(visibleTop / majorSpacing) * majorSpacing;
        const majorEndX = Math.ceil(visibleRight / majorSpacing) * majorSpacing;
        const majorEndY = Math.ceil(visibleBottom / majorSpacing) * majorSpacing;
        
        ctx.strokeStyle = majorGridColor;
        ctx.lineWidth = 2 / this.zoomLevel;
        ctx.beginPath();
        
        // Major vertical lines
        for (let x = majorStartX; x <= majorEndX; x += majorSpacing) {
            ctx.moveTo(x, majorStartY);
            ctx.lineTo(x, majorEndY);
        }
        
        // Major horizontal lines
        for (let y = majorStartY; y <= majorEndY; y += majorSpacing) {
            ctx.moveTo(majorStartX, y);
            ctx.lineTo(majorEndX, y);
        }
        
        ctx.stroke();
    }

    updatePreview() {
        this.initPreviewCanvas();
        if (!this.previewCanvas) return;
        
        const ctx = this.previewCanvas.getContext('2d');
        const canvas = this.previewCanvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply zoom and pan transformations
        ctx.save();
        ctx.translate(this.panX, this.panY);
        ctx.scale(this.zoomLevel, this.zoomLevel);
        
        // Draw grid that transforms with view
        this.drawGrid(ctx, canvas);
        
        if (this.elements.length === 0) {
            ctx.restore();
            return;
        }
        
        // Calculate pattern dimensions
        const patternLength = this.calculatePatternLength();
        if (patternLength <= 0) return;
        
        // Grid scale: each grid square = 0.1 units, grid is 20px
        const scale = 20 / 0.1; // 200 pixels per unit
        
        // Common properties
        const lineThickness = this.lineWeight;
        
        // Render based on selected shape
        switch (this.currentShape) {
            case 'line':
                this.renderLinePreview(ctx, canvas, patternLength, scale, lineThickness);
                break;
            case 'rectangle':
                this.renderRectanglePreview(ctx, canvas, patternLength, scale, lineThickness);
                break;
            case 'circle':
                this.renderCirclePreview(ctx, canvas, patternLength, scale, lineThickness);
                break;
            case 'triangle':
                this.renderTrianglePreview(ctx, canvas, patternLength, scale, lineThickness);
                break;
        }
        
        // Restore canvas transformation
        ctx.restore();
    }

    calculatePatternLength() {
        let totalLength = 0;
        for (const element of this.elements) {
            if (element.type === 'dash') {
                totalLength += Math.abs(element.value);
            } else if (element.type === 'dot') {
                totalLength += 0; // Dots have no length
            } else if (element.type === 'text') {
                totalLength += 0; // Text has no length - it's overlaid at current position
            }
        }
        return totalLength;
    }

    calculateFirstElementLength() {
        // Calculate just the first element length
        if (this.elements.length > 0) {
            const firstElement = this.elements[0];
            if (firstElement.type === 'dash') {
                return Math.abs(firstElement.value);
            }
            // Dots and text don't add length
        }
        return 0;
    }

    renderLinePreview(ctx, canvas, patternLength, scale, lineThickness) {
        // Line starts at grid coordinates (0,0)
        const startX = 0;
        const lineY = 0; // Position line at Y=0 in grid coordinates
        
        // Calculate how many repetitions to show for good visualization
        const patternWidthPx = patternLength * scale;
        const repetitions = Math.max(1, 8); // Show at least 8 repetitions
        
        for (let rep = 0; rep < repetitions; rep++) {
            const repStartX = startX + (rep * patternLength * scale);
            this.drawPattern(ctx, repStartX, lineY, scale, lineThickness, rep === repetitions - 1);
        }
    }

    renderRectanglePreview(ctx, canvas, patternLength, scale, lineThickness) {
        // Safety checks
        if (!ctx || !canvas || patternLength < 0 || scale <= 0) {
            console.warn('Invalid parameters for rectangle preview');
            return;
        }
        
        try {
            // Rectangle: Pattern goes around the perimeter
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // Define rectangle dimensions based on pattern length
            const minSizeUnits = 0.8; // Minimum 0.8 AutoCAD units
            const minSizePx = minSizeUnits * scale;
            
            // Calculate pattern length and first element length separately
            const patternLength = this.calculatePatternLength();
            const firstElementLength = this.calculateFirstElementLength();
            
            // Rectangle dimensions based on pattern:
            // Width = (3 × pattern length) + first element
            // Height = (2 × pattern length) + first element
            const rectWidthUnits = (3 * patternLength) + firstElementLength;
            const rectHeightUnits = (2 * patternLength) + firstElementLength;
            
            let rectWidth = Math.max(minSizePx, rectWidthUnits * scale);
            let rectHeight = Math.max(minSizePx, rectHeightUnits * scale);
            
            // Ensure minimum size for both dimensions independently
            if (rectWidth < minSizePx) {
                rectWidth = minSizePx;
            }
            if (rectHeight < minSizePx) {
                rectHeight = minSizePx;
            }
            
            // Additional safety checks
            if (rectWidth <= 0 || rectHeight <= 0) {
                console.warn('Invalid rectangle dimensions');
                return;
            }
            
            // Draw the rectangle with new framework
            this.drawNewRectangleFramework(ctx, centerX, centerY, rectWidth, rectHeight, patternLength, scale, lineThickness);
        } catch (error) {
            console.error('Error rendering rectangle preview:', error);
        }
    }

    renderCirclePreview(ctx, canvas, patternLength, scale, lineThickness) {
        // Circle: 6 iterations around the circumference, starting at top, going clockwise
        // Center the circle at grid coordinates (0,0)
        const centerX = 0;
        const centerY = 0;
        
        // Use configurable minimum radius for readability and usability
        const minRadiusPx = this.minCircleRadius;
        
        // Calculate desired radius based on pattern length
        const totalPatternLength = 6 * patternLength;
        const circumference = totalPatternLength * scale;
        const calculatedRadius = circumference / (2 * Math.PI);
        
        // Use the larger of calculated radius or minimum radius
        const radius = Math.max(calculatedRadius, minRadiusPx);
        
        // Calculate how many repetitions we can fit with the actual radius
        const actualCircumference = 2 * Math.PI * radius;
        const patternLengthPx = patternLength * scale;
        const repetitions = patternLengthPx > 0 ? Math.max(1, Math.floor(actualCircumference / patternLengthPx)) : 6;
        
        // Optional: Draw minimum radius indicator if radius was constrained
        if (this.showTextGuides && radius === minRadiusPx && calculatedRadius < minRadiusPx) {
            this.drawMinRadiusIndicator(ctx, centerX, centerY, calculatedRadius, radius);
        }
        
        // Draw the circle path with pattern
        this.drawPatternAlongCircle(ctx, centerX, centerY, radius, patternLength, scale, lineThickness, repetitions);
    }

    renderTrianglePreview(ctx, canvas, patternLength, scale, lineThickness) {
        // Safety checks
        if (!ctx || !canvas || patternLength < 0 || scale <= 0) {
            console.warn('Invalid parameters for triangle preview');
            return;
        }
        
        try {
            // Triangle: Equilateral triangle with bottom left at (0,0)
            const minSizeUnits = 0.8; // Minimum 0.8 AutoCAD units
            const minSizePx = minSizeUnits * scale;
            
            // Calculate triangle size based on pattern length
            // Base side length = (2 × pattern length) + first element
            const firstElementLength = this.calculateFirstElementLength();
            const baseSideUnits = (2 * patternLength) + firstElementLength;
            const baseSideLength = Math.max(minSizeUnits, baseSideUnits) * scale;
            
            // For equilateral triangle: height = (sqrt(3)/2) * base
            const triangleHeight = (Math.sqrt(3) / 2) * baseSideLength;
            
            // Draw the triangle with pattern framework
            this.drawTriangleFramework(ctx, baseSideLength, triangleHeight, patternLength, scale, lineThickness);
        } catch (error) {
            console.error('Error rendering triangle preview:', error);
        }
    }

    drawPatternAlongCircle(ctx, centerX, centerY, radius, patternLength, scale, lineThickness, repetitions) {
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#000';
        ctx.lineWidth = lineThickness;
        
        const totalCircumference = 2 * Math.PI * radius;
        const patternLengthPx = patternLength * scale;
        
        // Start at top (angle -π/2), go clockwise
        let currentAngle = -Math.PI / 2;
        
        for (let rep = 0; rep < repetitions; rep++) {
            const isLastRepetition = rep === repetitions - 1;
            currentAngle = this.drawPatternAlongCircleSegment(
                ctx, centerX, centerY, radius, currentAngle, 
                patternLengthPx, scale, lineThickness, isLastRepetition
            );
        }
    }

    drawPatternAlongCircleSegment(ctx, centerX, centerY, radius, startAngle, patternLengthPx, scale, lineThickness, isLastRepetition) {
        let currentAngle = startAngle;
        
        this.elements.forEach((element, index) => {
            const isLastElement = index === this.elements.length - 1;
            
            if (element.type === 'dash') {
                const length = Math.abs(element.value) * scale;
                const angleIncrement = length / radius;
                
                if (element.value > 0) {
                    // Visible dash - draw arc
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angleIncrement);
                    ctx.stroke();
                }
                // Move angle forward for both visible and invisible dashes
                currentAngle += angleIncrement;
                
            } else if (element.type === 'dot') {
                // Draw dot at current position
                const x = centerX + radius * Math.cos(currentAngle);
                const y = centerY + radius * Math.sin(currentAngle);
                const dotRadius = lineThickness / 2;
                
                ctx.beginPath();
                ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
                ctx.fill();
                // Dots don't advance position
                
            } else if (element.type === 'text') {
                const textValue = element.value;
                const fontSize = textValue.scale * 200 * 1.4;
                
                // Set font
                let fontFamily = 'Arial';
                switch(textValue.style?.toUpperCase()) {
                    case 'ROMANS':
                    case 'ROMANTIC':
                        fontFamily = 'Times New Roman';
                        break;
                    case 'MONOTXT':
                        fontFamily = 'Courier New';
                        break;
                    default:
                        fontFamily = 'Arial';
                        break;
                }
                
                ctx.font = `${fontSize}px ${fontFamily}`;
                
                // Calculate base position on circle
                const baseX = centerX + radius * Math.cos(currentAngle);
                const baseY = centerY + radius * Math.sin(currentAngle);
                
                // Calculate coordinate system for circle positioning
                // Tangent vector (direction along circle)
                const tangentX = -Math.sin(currentAngle);
                const tangentY = Math.cos(currentAngle);
                
                // Normal vector (pointing outward from circle)
                const normalX = Math.cos(currentAngle);
                const normalY = Math.sin(currentAngle);
                
                // Apply offsets in the circle's coordinate system
                // X offset: along tangent (positive = forward direction)
                // Y offset: along normal (positive = outward from circle)
                const offsetX = textValue.xOffset * scale * tangentX + textValue.yOffset * scale * normalX;
                const offsetY = textValue.xOffset * scale * tangentY + textValue.yOffset * scale * normalY;
                
                const textX = baseX + offsetX;
                const textY = baseY + offsetY;
                
                // Calculate text rotation and alignment based on type
                let textRotation = 0;
                let textAlign = 'left';
                let textBaseline = 'alphabetic';
                const rotationAngle = parseFloat(textValue.rotationAngle) || 0;
                const tangentAngle = currentAngle + Math.PI / 2; // Angle of tangent line
                
                switch(textValue.rotationType) {
                    case 'A': // Absolute rotation
                        textRotation = -rotationAngle * Math.PI / 180;
                        textAlign = 'left';
                        textBaseline = 'alphabetic';
                        break;
                        
                    case 'R': // Relative to line (tangent to circle)
                        textRotation = tangentAngle - rotationAngle * Math.PI / 180;
                        textAlign = 'left';
                        textBaseline = 'alphabetic';
                        break;
                        
                    case 'U': // Upright - for now make identical to R
                        textRotation = tangentAngle - rotationAngle * Math.PI / 180;
                        textAlign = 'left';
                        textBaseline = 'alphabetic';
                        break;
                }
                
                // Draw text using text box system
                this.drawTextInBox(ctx, textX, textY, textRotation, textValue, scale, tangentAngle);
                
                // Text doesn't advance position
            }
        });
        
        // Add the first element at the end if this is the last repetition (for clean pattern closure)
        if (isLastRepetition && this.elements.length > 0) {
            const firstElement = this.elements[0];
            
            if (firstElement.type === 'dash') {
                const length = Math.abs(firstElement.value) * scale;
                const angleIncrement = length / radius;
                
                if (firstElement.value > 0) {
                    // Visible dash - draw arc
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angleIncrement);
                    ctx.stroke();
                }
                // Update angle for potential future elements
                currentAngle += angleIncrement;
                
            } else if (firstElement.type === 'dot') {
                // Draw dot at current position
                const x = centerX + radius * Math.cos(currentAngle);
                const y = centerY + radius * Math.sin(currentAngle);
                const dotRadius = lineThickness / 2;
                
                ctx.beginPath();
                ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
                ctx.fill();
                
            } else if (firstElement.type === 'text') {
                const textValue = firstElement.value;
                const fontSize = textValue.scale * 200 * 1.4;
                
                // Set font
                let fontFamily = 'Arial';
                switch(textValue.style?.toUpperCase()) {
                    case 'ROMANS':
                    case 'ROMANTIC':
                        fontFamily = 'Times New Roman';
                        break;
                    case 'MONOTXT':
                        fontFamily = 'Courier New';
                        break;
                    default:
                        fontFamily = 'Arial';
                        break;
                }
                
                ctx.font = `${fontSize}px ${fontFamily}`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';
                
                // Calculate text position
                const baseX = centerX + radius * Math.cos(currentAngle);
                const baseY = centerY + radius * Math.sin(currentAngle);
                
                // Calculate coordinate system for circle positioning
                const tangentX = -Math.sin(currentAngle);
                const tangentY = Math.cos(currentAngle);
                const normalX = Math.cos(currentAngle);
                const normalY = Math.sin(currentAngle);
                
                // Apply offsets in the circle's coordinate system
                const offsetX = textValue.xOffset * scale * tangentX + textValue.yOffset * scale * normalX;
                const offsetY = textValue.xOffset * scale * tangentY + textValue.yOffset * scale * normalY;
                
                const textX = baseX + offsetX;
                const textY = baseY + offsetY;
                
                // Calculate text rotation based on type
                let textRotation = 0;
                const rotationAngle = parseFloat(textValue.rotationAngle) || 0;
                const tangentAngle = currentAngle + Math.PI / 2; // Angle of tangent line
                
                switch(textValue.rotationType) {
                    case 'A': textRotation = -rotationAngle * Math.PI / 180; break;
                    case 'R': textRotation = tangentAngle - rotationAngle * Math.PI / 180; break;
                    case 'U': 
                        let baseRotation = tangentAngle;
                        while (baseRotation > Math.PI) baseRotation -= 2 * Math.PI;
                        while (baseRotation < -Math.PI) baseRotation += 2 * Math.PI;
                        if (baseRotation > Math.PI / 2 && baseRotation < 3 * Math.PI / 2) {
                            textRotation = baseRotation + Math.PI - rotationAngle * Math.PI / 180;
                        } else {
                            textRotation = baseRotation - rotationAngle * Math.PI / 180;
                        }
                        break;
                }
                
                // Draw text using text box system
                this.drawTextInBox(ctx, textX, textY, textRotation, textValue, scale);
            }
        }
        
        return currentAngle;
    }

    drawNewRectangleFramework(ctx, centerX, centerY, width, height, patternLength, scale, lineThickness) {
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#000';
        ctx.lineWidth = lineThickness;
        
        // Calculate rectangle corners (upper left at 0,0)
        const left = 0;
        const right = width;
        const top = 0;
        const bottom = height;
        
        // Define the four sides according to your framework:
        // Top Side (0): Starts at top-left, goes right
        // Right Side (1): Starts at top-right, goes down  
        // Bottom Side (2): Starts at bottom-right, goes left
        // Left Side (3): Starts at bottom-left, goes up
        const sides = [
            { 
                name: 'Top', 
                startX: left, startY: top, 
                endX: right, endY: top, 
                direction: { x: 1, y: 0 } 
            },
            { 
                name: 'Right', 
                startX: right, startY: top, 
                endX: right, endY: bottom, 
                direction: { x: 0, y: 1 } 
            },
            { 
                name: 'Bottom', 
                startX: right, startY: bottom, 
                endX: left, endY: bottom, 
                direction: { x: -1, y: 0 } 
            },
            { 
                name: 'Left', 
                startX: left, startY: bottom, 
                endX: left, endY: top, 
                direction: { x: 0, y: -1 } 
            }
        ];
        
        // Draw corner connection dots for debugging (remove later)
        if (this.showTextGuides) {
            ctx.fillStyle = 'red';
            const cornerRadius = 3;
            ctx.beginPath();
            ctx.arc(left, top, cornerRadius, 0, 2 * Math.PI); // Top-left
            ctx.fill();
            ctx.beginPath();
            ctx.arc(right, top, cornerRadius, 0, 2 * Math.PI); // Top-right
            ctx.fill();
            ctx.beginPath();
            ctx.arc(right, bottom, cornerRadius, 0, 2 * Math.PI); // Bottom-right
            ctx.fill();
            ctx.beginPath();
            ctx.arc(left, bottom, cornerRadius, 0, 2 * Math.PI); // Bottom-left
            ctx.fill();
        }

        // Draw each side: Pattern, Pattern, Pattern, first element of pattern
        // But ensure corners connect by drawing connecting segments
        for (let sideIndex = 0; sideIndex < sides.length; sideIndex++) {
            this.drawRectangleSideWithFramework(ctx, sides[sideIndex], sideIndex, patternLength, scale, lineThickness);
        }
        
        // Draw corner connectors to ensure visual continuity
        this.drawCornerConnectors(ctx, sides, lineThickness);
    }

    drawRectangleSideWithFramework(ctx, side, sideIndex, patternLength, scale, lineThickness) {
        // Calculate side length
        const sideLength = Math.sqrt(
            Math.pow(side.endX - side.startX, 2) + 
            Math.pow(side.endY - side.startY, 2)
        );
        
        if (sideLength <= 0 || patternLength <= 0) return;
        
        const patternLengthPx = patternLength * scale;
        
        // Debug: Draw side start/end points
        if (this.showTextGuides) {
            ctx.fillStyle = 'blue';
            ctx.beginPath();
            ctx.arc(side.startX, side.startY, 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = 'green';
            ctx.beginPath();
            ctx.arc(side.endX, side.endY, 2, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw side name
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            const midX = (side.startX + side.endX) / 2;
            const midY = (side.startY + side.endY) / 2;
            ctx.fillText(side.name, midX, midY);
        }
        
        // Show thin baseline only when text guides are enabled
        if (this.showTextGuides) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = lineThickness / 4; // Thinner base line
            ctx.beginPath();
            ctx.moveTo(side.startX, side.startY);
            ctx.lineTo(side.endX, side.endY);
            ctx.stroke();
        }
        
        // Calculate how many complete patterns fit on this side
        const completePatterns = Math.floor(sideLength / patternLengthPx);
        
        let currentDistance = 0;
        
        // Draw complete patterns (Pattern, Pattern, Pattern...)
        for (let patternNum = 0; patternNum < completePatterns; patternNum++) {
            currentDistance = this.drawCompletePatternOnSide(ctx, side, currentDistance, sideLength, patternLength, scale, lineThickness, sideIndex);
        }
        
        // Draw first element of pattern to complete the side
        this.drawFirstElementOnSide(ctx, side, currentDistance, sideLength, patternLength, scale, lineThickness, sideIndex);
    }

    drawCompletePatternOnSide(ctx, side, startDistance, sideLength, patternLength, scale, lineThickness, sideIndex) {
        let currentDistance = startDistance;
        
        // Draw each element in the pattern
        for (const element of this.elements) {
            if (currentDistance >= sideLength) break;
            
            if (element.type === 'dash') {
                const length = Math.abs(element.value) * scale;
                
                if (element.value > 0) {
                    // Visible dash - draw line segment
                    const endDistance = Math.min(currentDistance + length, sideLength);
                    const startPos = this.getPositionAlongRectSide(side, currentDistance, sideLength);
                    const endPos = this.getPositionAlongRectSide(side, endDistance, sideLength);
                    
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = lineThickness;
                    ctx.beginPath();
                    ctx.moveTo(startPos.x, startPos.y);
                    ctx.lineTo(endPos.x, endPos.y);
                    ctx.stroke();
                }
                currentDistance += length;
                
            } else if (element.type === 'dot') {
                // Draw dot at current position
                const position = this.getPositionAlongRectSide(side, currentDistance, sideLength);
                const dotRadius = lineThickness / 2;
                
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(position.x, position.y, dotRadius, 0, 2 * Math.PI);
                ctx.fill();
                
            } else if (element.type === 'text') {
                // Draw text at current position
                const position = this.getPositionAlongRectSide(side, currentDistance, sideLength);
                this.drawTextOnRectSide(ctx, position, element, scale, lineThickness, sideIndex, side.direction);
            }
        }
        
        return currentDistance;
    }

    drawFirstElementOnSide(ctx, side, startDistance, sideLength, patternLength, scale, lineThickness, sideIndex) {
        if (startDistance >= sideLength || this.elements.length === 0) return;
        
        const firstElement = this.elements[0];
        let currentDistance = startDistance;
        
        if (firstElement.type === 'dash') {
            const length = Math.abs(firstElement.value) * scale;
            
            if (firstElement.value > 0) {
                // Visible dash - draw what fits
                const endDistance = Math.min(currentDistance + length, sideLength);
                const startPos = this.getPositionAlongRectSide(side, currentDistance, sideLength);
                const endPos = this.getPositionAlongRectSide(side, endDistance, sideLength);
                
                ctx.strokeStyle = '#000';
                ctx.lineWidth = lineThickness;
                ctx.beginPath();
                ctx.moveTo(startPos.x, startPos.y);
                ctx.lineTo(endPos.x, endPos.y);
                ctx.stroke();
            }
            
        } else if (firstElement.type === 'dot') {
            // Draw dot
            const position = this.getPositionAlongRectSide(side, currentDistance, sideLength);
            const dotRadius = lineThickness / 2;
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(position.x, position.y, dotRadius, 0, 2 * Math.PI);
            ctx.fill();
            
        } else if (firstElement.type === 'text') {
            // Draw text
            const position = this.getPositionAlongRectSide(side, currentDistance, sideLength);
            this.drawTextOnRectSide(ctx, position, firstElement, scale, lineThickness, sideIndex, side.direction);
        }
    }

    getPositionAlongRectSide(side, distance, sideLength) {
        const ratio = sideLength > 0 ? distance / sideLength : 0;
        return {
            x: side.startX + (side.endX - side.startX) * ratio,
            y: side.startY + (side.endY - side.startY) * ratio
        };
    }

    drawTextOnRectSide(ctx, position, element, scale, lineThickness, sideIndex, direction) {
        const textValue = element.value;
        
        // Set up text style using proper AutoCAD scaling
        const fontSize = textValue.scale * 200 * 1.4; // Match circle text scaling
        
        // Map AutoCAD text styles to web fonts
        let fontFamily = 'Arial';
        switch(textValue.style?.toUpperCase()) {
            case 'ROMANS':
            case 'ROMANTIC':
                fontFamily = 'Times New Roman';
                break;
            case 'MONOTXT':
                fontFamily = 'Courier New';
                break;
            case 'STANDARD':
            default:
                fontFamily = 'Arial';
                break;
        }
        
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        
        // Calculate side direction vectors
        const sideLength = Math.sqrt(
            Math.pow(direction.x, 2) + Math.pow(direction.y, 2)
        );
        
        // Normalize direction vectors
        let tangentX = direction.x;
        let tangentY = direction.y;
        let normalX = -direction.y; // Perpendicular (outward)
        let normalY = direction.x;
        
        if (sideLength > 0) {
            tangentX = direction.x / sideLength;
            tangentY = direction.y / sideLength;
            normalX = -tangentY; // Perpendicular (outward)
            normalY = tangentX;
        }
        
        // Apply offsets in the rectangle's coordinate system
        // X offset: along tangent (positive = forward direction)
        // Y offset: along normal (positive = outward from rectangle)
        // Note: Invert Y offset to match AutoCAD coordinate system (positive Y = up)
        const offsetX = textValue.xOffset * scale * tangentX + (-textValue.yOffset) * scale * normalX;
        const offsetY = textValue.xOffset * scale * tangentY + (-textValue.yOffset) * scale * normalY;
        
        const textX = position.x + offsetX;
        const textY = position.y + offsetY;
        
        // Calculate rotation based on rotation type
        let textRotation = 0;
        const rotationAngle = parseFloat(textValue.rotationAngle) || 0;
        const sideAngle = Math.atan2(direction.y, direction.x);
        
        switch(textValue.rotationType) {
            case 'A': 
                textRotation = -rotationAngle * Math.PI / 180; 
                break;
            case 'R': 
                textRotation = sideAngle - rotationAngle * Math.PI / 180; 
                break;
            case 'U': 
                // Upright text - EXACT same text box positioning as R-type
                textRotation = sideAngle - rotationAngle * Math.PI / 180; // Identical to R
                // Text flipping logic is handled in drawTextInBox method
                break;
        }
        
        // Draw text using text box system
        this.drawTextInBox(ctx, textX, textY, textRotation, textValue, scale, sideAngle);
    }

    drawTextInBox(ctx, x, y, boxRotation, textValue, scale, sideAngle = 0) {
        // Calculate text dimensions
        ctx.font = `${textValue.scale * 200 * 1.4}px Arial`;
        const textMetrics = ctx.measureText(textValue.text);
        const textWidth = textMetrics.width;
        
        // Text box height based on uppercase letters (cap height)
        // Lowercase letters with descenders will hang below the box
        const fontSize = textValue.scale * 200 * 1.4;
        const boxHeight = fontSize * 0.7; // Approximate cap height (70% of font size)
        
        // No padding - text box boundaries are tight against uppercase letters
        const boxWidth = textWidth;
        
        // Calculate text rotation inside box based on rotation type
        let textRotationInBox = 0;
        const rotationAngle = parseFloat(textValue.rotationAngle) || 0;
        
        // Calculate text anchor point based on rotation type
        let textAnchorX = 0;
        let textAnchorY = 0;
        
        if (textValue.rotationType === 'R' || textValue.rotationType === 'A') {
            // R and A types: always anchor at BL (0, 0)
            textAnchorX = 0;
            textAnchorY = 0;
            textRotationInBox = 0;
        } else if (textValue.rotationType === 'U') {
            // U type: anchor point changes based on line direction
            if (sideAngle !== undefined) {
                let angleDegrees = (sideAngle * 180 / Math.PI);
                // Normalize to 0-360 range
                while (angleDegrees < 0) angleDegrees += 360;
                while (angleDegrees >= 360) angleDegrees -= 360;
                
                // Configurable angle limits for U-type rotation
                const lowAngleLimit = 91;   // Lower bound for alternate positioning
                const highAngleLimit = 269; // Upper bound for alternate positioning
                
                if (angleDegrees >= lowAngleLimit && angleDegrees <= highAngleLimit) {
                    // Within angle limits: anchor at alternate position and rotate text 180°
                    textAnchorX = -boxWidth;
                    textAnchorY = boxHeight;
                    textRotationInBox = Math.PI; // Rotate text 180° about its basepoint
                } else {
                    // Outside angle limits: anchor at BL (Bottom-Left), no rotation
                    textAnchorX = 0;
                    textAnchorY = 0;
                    textRotationInBox = 0; // No rotation
                }
            } else {
                textRotationInBox = 0; // No rotation if no sideAngle provided
            }
        }
        
        ctx.save();
        
        // Position and rotate the text box
        ctx.translate(x, y);
        ctx.rotate(boxRotation);
        
        // Optional: Draw text box outline (for debugging)
        if (this.showTextGuides) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, -boxHeight, boxWidth, boxHeight);
            
            // Mark the text box anchor point with a red dot
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Mark the text content anchor point with a purple dot
            ctx.fillStyle = 'purple';
            ctx.beginPath();
            ctx.arc(textAnchorX, textAnchorY, 2, 0, 2 * Math.PI);
            ctx.fill();
            
            // Label all four corners of the text box
            ctx.fillStyle = 'blue';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Bottom-left corner (0, 0)
            ctx.fillText('BL', 0, 0);
            
            // Bottom-right corner (boxWidth, 0)
            ctx.fillText('BR', boxWidth, 0);
            
            // Top-left corner (0, -boxHeight)
            ctx.fillText('TL', 0, -boxHeight);
            
            // Top-right corner (boxWidth, -boxHeight)
            ctx.fillText('TR', boxWidth, -boxHeight);
        }
        
        // Draw text content anchored to its specific corner of the text box
        ctx.rotate(textRotationInBox);
        
        // Set text properties
        ctx.fillStyle = '#000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.font = `${textValue.scale * 200 * 1.4}px Arial`;
        
        // Position text at the anchor point
        ctx.fillText(textValue.text, textAnchorX, textAnchorY);
        
        ctx.restore();
    }

    drawCornerConnectors(ctx, sides, lineThickness) {
        // Draw small connecting lines at corners to ensure visual continuity
        ctx.strokeStyle = '#000';
        ctx.lineWidth = lineThickness;
        
        for (let i = 0; i < sides.length; i++) {
            const currentSide = sides[i];
            const nextSide = sides[(i + 1) % sides.length];
            
            // Check if there's a gap between current side end and next side start
            const gapX = Math.abs(currentSide.endX - nextSide.startX);
            const gapY = Math.abs(currentSide.endY - nextSide.startY);
            const gap = Math.sqrt(gapX * gapX + gapY * gapY);
            
            // If there's a small gap (should be 0 for perfect rectangle), draw a connector
            if (gap > 0.1 && gap < 5) { // Only for small gaps
                ctx.beginPath();
                ctx.moveTo(currentSide.endX, currentSide.endY);
                ctx.lineTo(nextSide.startX, nextSide.startY);
                ctx.stroke();
                
                if (this.showTextGuides) {
                    ctx.fillStyle = 'orange';
                    ctx.beginPath();
                    ctx.arc((currentSide.endX + nextSide.startX) / 2, (currentSide.endY + nextSide.startY) / 2, 1, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
    }

    drawTriangleFramework(ctx, baseLength, height, patternLength, scale, lineThickness) {
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#000';
        ctx.lineWidth = lineThickness;
        
        // Define equilateral triangle vertices with bottom left at (0,0)
        const bottomLeft = { x: 0, y: 0 };
        const bottomRight = { x: baseLength, y: 0 };
        const top = { x: baseLength / 2, y: height };
        
        // Define the three sides of the triangle:
        // Bottom Side (0): Starts at bottom-left, goes right to bottom-right
        // Right Side (1): Starts at bottom-right, goes up-left to top
        // Left Side (2): Starts at top, goes down-left to bottom-left  
        const sides = [
            {
                name: 'Bottom',
                startX: bottomLeft.x, startY: bottomLeft.y,
                endX: bottomRight.x, endY: bottomRight.y,
                direction: { x: 1, y: 0 }
            },
            {
                name: 'Right',
                startX: bottomRight.x, startY: bottomRight.y,
                endX: top.x, endY: top.y,
                direction: { x: -0.5, y: Math.sqrt(3)/2 } // Up and left for equilateral
            },
            {
                name: 'Left',
                startX: top.x, startY: top.y,
                endX: bottomLeft.x, endY: bottomLeft.y,
                direction: { x: -0.5, y: -Math.sqrt(3)/2 } // Down and left for equilateral
            }
        ];
        
        // Draw corner connection dots for debugging
        if (this.showTextGuides) {
            ctx.fillStyle = 'red';
            const cornerRadius = 3;
            [bottomLeft, bottomRight, top].forEach(vertex => {
                ctx.beginPath();
                ctx.arc(vertex.x, vertex.y, cornerRadius, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
        
        // Draw each side: Pattern, Pattern, Pattern, first element of pattern
        for (let sideIndex = 0; sideIndex < sides.length; sideIndex++) {
            this.drawTriangleSideWithFramework(ctx, sides[sideIndex], sideIndex, patternLength, scale, lineThickness);
        }
        
        // Draw corner connectors to ensure visual continuity
        this.drawCornerConnectors(ctx, sides, lineThickness);
    }

    drawTriangleSideWithFramework(ctx, side, sideIndex, patternLength, scale, lineThickness) {
        // Calculate side length
        const sideLength = Math.sqrt(
            Math.pow(side.endX - side.startX, 2) + 
            Math.pow(side.endY - side.startY, 2)
        );
        
        if (sideLength <= 0 || patternLength <= 0) return;
        
        const patternLengthPx = patternLength * scale;
        
        // Debug: Draw side start/end points
        if (this.showTextGuides) {
            ctx.fillStyle = 'blue';
            ctx.beginPath();
            ctx.arc(side.startX, side.startY, 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = 'green';
            ctx.beginPath();
            ctx.arc(side.endX, side.endY, 2, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw side name
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            const midX = (side.startX + side.endX) / 2;
            const midY = (side.startY + side.endY) / 2;
            ctx.fillText(side.name, midX, midY);
        }
        
        // Show thin baseline only when text guides are enabled
        if (this.showTextGuides) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = lineThickness / 4; // Thinner base line
            ctx.beginPath();
            ctx.moveTo(side.startX, side.startY);
            ctx.lineTo(side.endX, side.endY);
            ctx.stroke();
        }
        
        // Calculate how many complete patterns fit on this side
        const completePatterns = Math.floor(sideLength / patternLengthPx);
        
        let currentDistance = 0;
        
        // Draw complete patterns (Pattern, Pattern, Pattern...)
        for (let patternNum = 0; patternNum < completePatterns; patternNum++) {
            currentDistance = this.drawCompletePatternOnTriangleSide(ctx, side, currentDistance, sideLength, patternLength, scale, lineThickness, sideIndex);
        }
        
        // Draw first element of pattern to complete the side
        this.drawFirstElementOnTriangleSide(ctx, side, currentDistance, sideLength, patternLength, scale, lineThickness, sideIndex);
    }

    drawCompletePatternOnTriangleSide(ctx, side, startDistance, sideLength, patternLength, scale, lineThickness, sideIndex) {
        let currentDistance = startDistance;
        
        // Draw each element in the pattern
        for (const element of this.elements) {
            if (currentDistance >= sideLength) break;
            
            if (element.type === 'dash') {
                const length = Math.abs(element.value) * scale;
                
                if (element.value > 0) {
                    // Visible dash - draw line segment
                    const endDistance = Math.min(currentDistance + length, sideLength);
                    const startPos = this.getPositionAlongTriangleSide(side, currentDistance, sideLength);
                    const endPos = this.getPositionAlongTriangleSide(side, endDistance, sideLength);
                    
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = lineThickness;
                    ctx.beginPath();
                    ctx.moveTo(startPos.x, startPos.y);
                    ctx.lineTo(endPos.x, endPos.y);
                    ctx.stroke();
                }
                currentDistance += length;
                
            } else if (element.type === 'dot') {
                // Draw dot at current position
                const position = this.getPositionAlongTriangleSide(side, currentDistance, sideLength);
                const dotRadius = lineThickness / 2;
                
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(position.x, position.y, dotRadius, 0, 2 * Math.PI);
                ctx.fill();
                
            } else if (element.type === 'text') {
                // Draw text at current position
                const position = this.getPositionAlongTriangleSide(side, currentDistance, sideLength);
                this.drawTextOnTriangleSide(ctx, position, element, scale, lineThickness, sideIndex, side.direction);
            }
        }
        
        return currentDistance;
    }

    drawFirstElementOnTriangleSide(ctx, side, startDistance, sideLength, patternLength, scale, lineThickness, sideIndex) {
        if (startDistance >= sideLength || this.elements.length === 0) return;
        
        const firstElement = this.elements[0];
        let currentDistance = startDistance;
        
        if (firstElement.type === 'dash') {
            const length = Math.abs(firstElement.value) * scale;
            
            if (firstElement.value > 0) {
                // Visible dash - draw what fits
                const endDistance = Math.min(currentDistance + length, sideLength);
                const startPos = this.getPositionAlongTriangleSide(side, currentDistance, sideLength);
                const endPos = this.getPositionAlongTriangleSide(side, endDistance, sideLength);
                
                ctx.strokeStyle = '#000';
                ctx.lineWidth = lineThickness;
                ctx.beginPath();
                ctx.moveTo(startPos.x, startPos.y);
                ctx.lineTo(endPos.x, endPos.y);
                ctx.stroke();
            }
            
        } else if (firstElement.type === 'dot') {
            // Draw dot
            const position = this.getPositionAlongTriangleSide(side, currentDistance, sideLength);
            const dotRadius = lineThickness / 2;
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(position.x, position.y, dotRadius, 0, 2 * Math.PI);
            ctx.fill();
            
        } else if (firstElement.type === 'text') {
            // Draw text
            const position = this.getPositionAlongTriangleSide(side, currentDistance, sideLength);
            this.drawTextOnTriangleSide(ctx, position, firstElement, scale, lineThickness, sideIndex, side.direction);
        }
    }

    getPositionAlongTriangleSide(side, distance, sideLength) {
        const ratio = sideLength > 0 ? distance / sideLength : 0;
        return {
            x: side.startX + (side.endX - side.startX) * ratio,
            y: side.startY + (side.endY - side.startY) * ratio
        };
    }

    drawTextOnTriangleSide(ctx, position, element, scale, lineThickness, sideIndex, direction) {
        const textValue = element.value;
        
        // Set up text style using proper AutoCAD scaling
        const fontSize = textValue.scale * 200 * 1.4;
        
        // Map AutoCAD text styles to web fonts
        let fontFamily = 'Arial';
        switch(textValue.style?.toUpperCase()) {
            case 'ROMANS':
            case 'ROMANTIC':
                fontFamily = 'Times New Roman';
                break;
            case 'MONOTXT':
                fontFamily = 'Courier New';
                break;
            case 'STANDARD':
            default:
                fontFamily = 'Arial';
                break;
        }
        
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        
        // Calculate side direction vectors
        const sideLength = Math.sqrt(
            Math.pow(direction.x, 2) + Math.pow(direction.y, 2)
        );
        
        // Normalize direction vectors
        let tangentX = direction.x;
        let tangentY = direction.y;
        let normalX = -direction.y; // Perpendicular (outward)
        let normalY = direction.x;
        
        if (sideLength > 0) {
            tangentX = direction.x / sideLength;
            tangentY = direction.y / sideLength;
            normalX = -tangentY; // Perpendicular (outward)
            normalY = tangentX;
        }
        
        // Apply offsets in the triangle's coordinate system
        // X offset: along tangent (positive = forward direction)
        // Y offset: along normal (positive = outward from triangle)
        // Note: Invert Y offset to match AutoCAD coordinate system (positive Y = up)
        const offsetX = textValue.xOffset * scale * tangentX + (-textValue.yOffset) * scale * normalX;
        const offsetY = textValue.xOffset * scale * tangentY + (-textValue.yOffset) * scale * normalY;
        
        const textX = position.x + offsetX;
        const textY = position.y + offsetY;
        
        // Calculate rotation based on rotation type
        let textRotation = 0;
        const rotationAngle = parseFloat(textValue.rotationAngle) || 0;
        const sideAngle = Math.atan2(direction.y, direction.x);
        
        switch(textValue.rotationType) {
            case 'A': 
                textRotation = -rotationAngle * Math.PI / 180; 
                break;
            case 'R': 
                textRotation = sideAngle - rotationAngle * Math.PI / 180; 
                break;
            case 'U': 
                // Upright text - EXACT same text box positioning as R-type
                textRotation = sideAngle - rotationAngle * Math.PI / 180; // Identical to R
                // Text flipping logic is handled in drawTextInBox method
                break;
        }
        
        // Draw text using text box system
        this.drawTextInBox(ctx, textX, textY, textRotation, textValue, scale, sideAngle);
    }

    drawDashAlongRectanglePath(ctx, sides, startDistance, length) {
        // Safety check to prevent infinite loops
        if (length <= 0) return;
        
        const totalPerimeter = this.calculateRectanglePerimeter(sides);
        if (totalPerimeter <= 0) return;
        
        // Draw a dash that might span multiple sides of the rectangle
        let remainingLength = length;
        let currentDistance = startDistance % totalPerimeter; // Ensure valid starting distance
        let iterations = 0;
        const maxIterations = 100; // Safety limit
        
        ctx.beginPath();
        
        while (remainingLength > 0.01 && iterations < maxIterations) { // Add small threshold and iteration limit
            iterations++;
            
            const position = this.getPositionOnRectanglePerimeter(sides, currentDistance);
            const sideInfo = this.getSideInfoAtDistance(sides, currentDistance);
            
            // Calculate how much we can draw on the current side
            const distanceToSideEnd = sideInfo.sideEndDistance - currentDistance;
            const segmentLength = Math.min(remainingLength, Math.max(0, distanceToSideEnd));
            
            // Safety check
            if (segmentLength <= 0) {
                // Jump to next side
                currentDistance = sideInfo.sideEndDistance % totalPerimeter;
                continue;
            }
            
            // Calculate end position for this segment
            const endDistance = currentDistance + segmentLength;
            const endPosition = this.getPositionOnRectanglePerimeter(sides, endDistance);
            
            // Draw line segment
            ctx.moveTo(position.x, position.y);
            ctx.lineTo(endPosition.x, endPosition.y);
            
            // Update for next iteration
            remainingLength -= segmentLength;
            currentDistance = (currentDistance + segmentLength) % totalPerimeter;
        }
        
        ctx.stroke();
    }

    getPositionOnRectanglePerimeter(sides, distance) {
        const totalPerimeter = this.calculateRectanglePerimeter(sides);
        
        // Safety checks
        if (totalPerimeter <= 0 || sides.length === 0) {
            return sides.length > 0 ? sides[0].start : {x: 0, y: 0};
        }
        
        distance = distance % totalPerimeter; // Wrap around
        if (distance < 0) distance += totalPerimeter; // Handle negative distances
        
        let accumulatedDistance = 0;
        
        for (const side of sides) {
            const sideLength = this.calculateDistance(side.start, side.end);
            
            if (distance <= accumulatedDistance + sideLength) {
                // Position is on this side
                const distanceAlongSide = distance - accumulatedDistance;
                const ratio = sideLength > 0 ? distanceAlongSide / sideLength : 0;
                
                return {
                    x: side.start.x + (side.end.x - side.start.x) * ratio,
                    y: side.start.y + (side.end.y - side.start.y) * ratio
                };
            }
            
            accumulatedDistance += sideLength;
        }
        
        // Fallback to start position if something goes wrong
        return sides[0].start;
    }

    getDirectionOnRectanglePerimeter(sides, distance) {
        const totalPerimeter = this.calculateRectanglePerimeter(sides);
        distance = distance % totalPerimeter; // Wrap around
        
        let accumulatedDistance = 0;
        
        for (const side of sides) {
            const sideLength = this.calculateDistance(side.start, side.end);
            
            if (distance <= accumulatedDistance + sideLength) {
                // Position is on this side, return its direction
                return side.direction;
            }
            
            accumulatedDistance += sideLength;
        }
        
        // Fallback to first side direction
        return sides[0].direction;
    }

    getSideInfoAtDistance(sides, distance) {
        const totalPerimeter = this.calculateRectanglePerimeter(sides);
        distance = distance % totalPerimeter; // Wrap around
        
        let accumulatedDistance = 0;
        
        for (let i = 0; i < sides.length; i++) {
            const side = sides[i];
            const sideLength = this.calculateDistance(side.start, side.end);
            
            if (distance <= accumulatedDistance + sideLength) {
                return {
                    sideIndex: i,
                    sideStartDistance: accumulatedDistance,
                    sideEndDistance: accumulatedDistance + sideLength,
                    sideLength: sideLength
                };
            }
            
            accumulatedDistance += sideLength;
        }
        
        // Fallback
        return {
            sideIndex: 0,
            sideStartDistance: 0,
            sideEndDistance: this.calculateDistance(sides[0].start, sides[0].end),
            sideLength: this.calculateDistance(sides[0].start, sides[0].end)
        };
    }

    calculateRectanglePerimeter(sides) {
        return sides.reduce((total, side) => {
            return total + this.calculateDistance(side.start, side.end);
        }, 0);
    }

    calculateDistance(point1, point2) {
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }

    drawPattern(ctx, startX, lineY, scale, lineThickness, isLastRepetition = false) {
        let currentX = startX;
        
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#000';
        ctx.lineWidth = lineThickness;
        
        for (const element of this.elements) {
            if (element.type === 'dash') {
                const length = Math.abs(element.value) * scale;
                
                if (element.value >= 0) {
                    // Visible dash - draw line
                    ctx.beginPath();
                    ctx.moveTo(currentX, lineY);
                    ctx.lineTo(currentX + length, lineY);
                    ctx.stroke();
                } 
                // Invisible dash (gap) - just move position, don't draw
                
                currentX += length;
                
            } else if (element.type === 'dot') {
                // Draw dot as small circle
                const radius = lineThickness / 2;
                ctx.beginPath();
                ctx.arc(currentX, lineY, radius, 0, 2 * Math.PI);
                ctx.fill();
                // Dots don't advance position
                
            } else if (element.type === 'text') {
                const textValue = element.value;
                // Text scale represents height in units, convert to pixels
                // Compensate for actual text height being ~70% of font-size
                const fontSize = textValue.scale * 200 * 1.4; // Adjusted for actual text height
                
                // Set font
                let fontFamily = 'Arial';
                switch(textValue.style?.toUpperCase()) {
                    case 'ROMANS':
                    case 'ROMANTIC':
                        fontFamily = 'Times New Roman';
                        break;
                    case 'MONOTXT':
                        fontFamily = 'Courier New';
                        break;
                }
                
                ctx.font = `${fontSize}px ${fontFamily}`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';
                
                // Calculate base text position with offsets
                // For horizontal lines, coordinate system is simple:
                // X offset: along line (positive = right)
                // Y offset: perpendicular to line (positive = up in AutoCAD, down in canvas)
                const textX = currentX + (textValue.xOffset * scale);
                const textY = lineY - (textValue.yOffset * scale); // Negative because canvas Y is flipped
                
                // Calculate rotation based on type
                let textRotation = 0;
                const rotationAngle = parseFloat(textValue.rotationAngle) || 0;
                
                switch(textValue.rotationType) {
                    case 'A': // Absolute rotation
                        textRotation = -rotationAngle * Math.PI / 180;
                        break;
                        
                    case 'R': // Relative to line (for horizontal line, 0° = horizontal)
                        textRotation = -rotationAngle * Math.PI / 180;
                        break;
                        
                    case 'U': // Upright (always readable)
                        // For horizontal lines, text is always upright (0°) plus user rotation
                        textRotation = -rotationAngle * Math.PI / 180;
                        break;
                }
                
                // Draw text using text box system (line angle = 0° for horizontal lines)
                this.drawTextInBox(ctx, textX, textY, textRotation, textValue, scale, 0);
                
                // Text doesn't advance position - it's overlaid at current position
                // currentX remains unchanged
            }
        }
        
        // Add the first element at the end of the last repetition to show pattern continuation
        if (isLastRepetition && this.elements.length > 0) {
            const firstElement = this.elements[0];
            
            if (firstElement.type === 'dash') {
                const length = Math.abs(firstElement.value) * scale;
                
                if (firstElement.value >= 0) {
                    // Visible dash - draw line
                    ctx.beginPath();
                    ctx.moveTo(currentX, lineY);
                    ctx.lineTo(currentX + length, lineY);
                    ctx.stroke();
                }
                // Invisible dash (gap) - just move position, don't draw
                
            } else if (firstElement.type === 'dot') {
                // Draw dot as small circle
                const radius = lineThickness / 2;
                ctx.beginPath();
                ctx.arc(currentX, lineY, radius, 0, 2 * Math.PI);
                ctx.fill();
                
            } else if (firstElement.type === 'text') {
                const textValue = firstElement.value;
                // Text scale represents height in units, convert to pixels
                // Compensate for actual text height being ~70% of font-size
                const fontSize = textValue.scale * 200 * 1.4; // Adjusted for actual text height
                
                // Set font
                let fontFamily = 'Arial';
                switch(textValue.style?.toUpperCase()) {
                    case 'ROMANS':
                    case 'ROMANTIC':
                        fontFamily = 'Times New Roman';
                        break;
                    case 'MONOTXT':
                        fontFamily = 'Courier New';
                        break;
                }
                
                ctx.font = `${fontSize}px ${fontFamily}`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';
                
                // Calculate base text position with offsets
                const textX = currentX + (textValue.xOffset * scale);
                const textY = lineY - (textValue.yOffset * scale);
                
                // Calculate rotation based on type
                let textRotation = 0;
                const rotationAngle = parseFloat(textValue.rotationAngle) || 0;
                
                switch(textValue.rotationType) {
                    case 'A': // Absolute rotation
                        textRotation = -rotationAngle * Math.PI / 180;
                        break;
                        
                    case 'R': // Relative to line
                        textRotation = -rotationAngle * Math.PI / 180;
                        break;
                        
                    case 'U': // Upright
                        textRotation = -rotationAngle * Math.PI / 180;
                        break;
                }
                
                // Draw text using text box system (line angle = 0° for horizontal lines)
                this.drawTextInBox(ctx, textX, textY, textRotation, textValue, scale, 0);
                
                // Text doesn't advance position in the end loop either
            }
        }
    }

    incrementTextProperty(id, property, increment) {
        const elementIndex = this.elements.findIndex(element => element.id === id);
        if (elementIndex !== -1) {
            const element = this.elements[elementIndex];
            const currentValue = element.value[property] || 0;
            let newValue;
            
            // Different precision for different properties
            if (property === 'rotationAngle') {
                newValue = Math.round((currentValue + increment) * 10) / 10; // Round to 1 decimal
            } else {
                newValue = Math.round((currentValue + increment) * 100) / 100; // Round to 2 decimals
            }
            
            // Prevent negative scale
            if (property === 'scale') {
                element.value[property] = Math.max(0, newValue);
            } else {
                element.value[property] = newValue;
            }
            
            // Update the input field directly instead of re-rendering
            const card = document.querySelector(`[data-element-id="${id}"]`);
            let inputSelector;
            switch(property) {
                case 'scale': inputSelector = '.scale-input'; break;
                case 'xOffset': inputSelector = '.offset-input'; break;
                case 'yOffset': inputSelector = '.offset-input'; break;
                case 'rotationAngle': inputSelector = '.angle-input'; break;
            }
            
            if (inputSelector) {
                const inputs = card?.querySelectorAll(inputSelector);
                if (property === 'xOffset' && inputs?.[0]) {
                    inputs[0].value = element.value[property];
                } else if (property === 'yOffset' && inputs?.[1]) {
                    inputs[1].value = element.value[property];
                } else if (inputs?.[0]) {
                    inputs[0].value = element.value[property];
                }
            }
            
            this.updateOutput();
        }
    }



    generateLinCode() {
        const elementsCount = this.elements.length;
        
        if (elementsCount === 0) {
            return '';
        }

        if (elementsCount < this.MIN_ELEMENTS) {
            return `; ERROR: Line type requires at least ${this.MIN_ELEMENTS} elements (currently ${elementsCount})\n; Add more elements to generate valid .lin code`;
        }

        const name = this.linetypeName.value.trim() || 'MYLINETYPE';
        const description = this.linetypeDesc.value.trim() || 'Custom line type description';
        
        // Validate name length (AutoCAD limit is 31 characters)
        if (name.length > 31) {
            return `; ERROR: Line type name too long (${name.length} characters, max 31)\n; Shorten the name to generate valid .lin code`;
        }
        
        // First line: *NAME,Description
        const firstLine = `*${name.toUpperCase()},${description}`;
        
        // Second line: A,pattern
        let pattern = 'A';
        
        this.elements.forEach(element => {
            switch(element.type) {
                case 'dash':
                    pattern += `,${element.value}`;
                    break;
                case 'dot':
                    pattern += `,0`;
                    break;
                case 'text':
                    const text = element.value;
                    pattern += `,[\"${text.text}\",${text.style},S=${text.scale},${text.rotationType}=${text.rotationAngle},X=${text.xOffset},Y=${text.yOffset}]`;
                    break;
            }
        });
        
        return `${firstLine}\n${pattern}`;
    }

    updateOutput() {
        const code = this.generateLinCode();
        this.outputCode.value = code;
        
        // Add error styling if there are issues
        if (code.startsWith('; ERROR:')) {
            this.outputCode.classList.add('error');
        } else {
            this.outputCode.classList.remove('error');
        }
        
        this.updatePreview();
    }

    copyCode() {
        const code = this.generateLinCode();
        if (code.startsWith('; ERROR:')) {
            this.showNotification('Cannot copy: Fix errors first');
            return;
        }
        
        this.outputCode.select();
        this.outputCode.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            this.showNotification('Code copied to clipboard!');
        } catch (err) {
            this.showNotification('Failed to copy code');
        }
    }

    downloadLinFile() {
        const code = this.generateLinCode();
        if (!code.trim()) {
            this.showNotification('No line type to download');
            return;
        }
        
        if (code.startsWith('; ERROR:')) {
            this.showNotification('Cannot download: Fix errors first');
            return;
        }
        
        const filename = (this.linetypeName.value.trim() || 'customline') + '.lin';
        const blob = new Blob([code], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification(`Downloaded ${filename}`);
    }

    // Drag and Drop Methods
    handleDragStart(e) {
        // Find the parent card from the drag handle
        this.draggedElement = e.target.closest('.element-card');
        this.draggedIndex = parseInt(this.draggedElement.dataset.index);
        this.draggedElement.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.draggedElement.outerHTML);
    }

    handleDragEnd(e) {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
        }
        this.draggedElement = null;
        this.draggedIndex = null;
        
        // Remove all drop zone indicators
        document.querySelectorAll('.element-card').forEach(card => {
            card.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    handleDragEnter(e) {
        const card = e.target.closest('.element-card');
        if (card && card !== this.draggedElement) {
            card.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const card = e.target.closest('.element-card');
        if (card && !card.contains(e.relatedTarget)) {
            card.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        const card = e.target.closest('.element-card');
        if (card && card !== this.draggedElement) {
            const dropIndex = parseInt(card.dataset.index);
            this.reorderElements(this.draggedIndex, dropIndex);
        }

        return false;
    }

    reorderElements(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;

        // Remove the element from its current position
        const [movedElement] = this.elements.splice(fromIndex, 1);
        
        // Insert it at the new position
        this.elements.splice(toIndex, 0, movedElement);
        
        // Re-render the cards and update output
        this.renderCards();
        this.updateOutput();
    }

    // Click and Hold functionality for increment buttons
    addClickAndHold(button) {
        let interval;
        let timeout;
        let isPressed = false;
        
        const startIncrement = () => {
            if (isPressed) return; // Prevent multiple starts
            isPressed = true;
            
            // Initial delay before starting rapid increment
            timeout = setTimeout(() => {
                if (isPressed) { // Check if still pressed
                    // Start rapid increment every 100ms
                    interval = setInterval(() => {
                        if (isPressed) {
                            button.click();
                        } else {
                            stopIncrement();
                        }
                    }, 100);
                }
            }, 500); // Wait 500ms before starting rapid increment
        };
        
        const stopIncrement = () => {
            isPressed = false;
            clearTimeout(timeout);
            clearInterval(interval);
            timeout = null;
            interval = null;
        };
        
        // Mouse events
        button.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent text selection
            startIncrement();
        });
        
        button.addEventListener('mouseup', stopIncrement);
        button.addEventListener('mouseleave', stopIncrement);
        
        // Global mouse up to catch releases outside the button
        document.addEventListener('mouseup', () => {
            if (isPressed) {
                stopIncrement();
            }
        });
        
        // Touch events for mobile
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startIncrement();
        });
        
        button.addEventListener('touchend', stopIncrement);
        button.addEventListener('touchcancel', stopIncrement);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem 2rem;
            border-radius: 5px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    drawTextGuides(ctx, textX, textY, rotation, textValue, scale) {
        // Draw text positioning guides for debugging
        ctx.save();
        
        // Draw anchor point
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(textX, textY, 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw coordinate axes at text position
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        const axisLength = 20;
        
        ctx.translate(textX, textY);
        ctx.rotate(rotation);
        
        // X-axis (red)
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(axisLength, 0);
        ctx.stroke();
        
        // Y-axis (green) 
        ctx.strokeStyle = 'green';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -axisLength); // Negative because canvas Y is flipped
        ctx.stroke();
        
        // Draw text bounding box approximation
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 1;
        const textWidth = textValue.text.length * textValue.scale * 100; // Approximate
        const textHeight = textValue.scale * 200;
        ctx.strokeRect(0, -textHeight * 0.7, textWidth, textHeight);
        
        ctx.restore();
    }

    drawMinRadiusIndicator(ctx, centerX, centerY, calculatedRadius, actualRadius) {
        // Draw indicator showing the difference between calculated and minimum radius
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.6)'; // Orange
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // Dashed line
        
        // Draw the calculated radius circle (what it would be without minimum)
        if (calculatedRadius > 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, calculatedRadius, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        // Draw text indicator
        ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Min radius: 0.8 units applied', centerX, centerY - actualRadius - 15);
        
        ctx.restore();
    }
}

// Initialize the application
let lineTypeBuilder;

document.addEventListener('DOMContentLoaded', function() {
    lineTypeBuilder = new LineTypeBuilder();
});

// Global functions for HTML onclick handlers
function toggleImportBar() {
    lineTypeBuilder.toggleImportBar();
}

function importFromText() {
    lineTypeBuilder.importFromText();
}

function closeImportBar() {
    lineTypeBuilder.closeImportBar();
}

// Close import bar when clicking outside - REMOVED
// Import bar now only closes with X button or Cancel button

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);