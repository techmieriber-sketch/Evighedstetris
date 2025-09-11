// Tetris Puslespil - Forbedret Drag & Drop version
console.log('Tetris.js file loaded!');

class TetrisPuzzle {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.piecesArea = document.getElementById('piecesArea');
        
        // Tjek om elementerne findes
        if (!this.canvas) {
            console.error('Canvas element ikke fundet!');
            return;
        }
        if (!this.piecesArea) {
            console.error('Pieces area element ikke fundet!');
            return;
        }
        
        console.log('Canvas element fundet:', this.canvas);
        console.log('Pieces area element fundet:', this.piecesArea);
        
        console.log('TetrisPuzzle initialiseret');
        
        // Gør spillepladen større for iPad
        this.BOARD_WIDTH = 10;  // Reduceret fra 14 til 10 for at passe med større brikker
        this.BOARD_HEIGHT = 20; // Reduceret fra 22 til 20 for at passe med større brikker
        this.BLOCK_SIZE = 60;   // Øget fra 30 til 60 - dobbelt så store brikker
        
        // Opdater canvas størrelse responsivt
        this.updateCanvasSize();
        
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.availablePieces = [];
        this.selectedPiece = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.dragPosition = { x: 0, y: 0 }; // Tilføj manglende dragPosition
        
        // Touch state tracking
        this.touchStartTime = 0;
        this.touchStartPosition = { x: 0, y: 0 };
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        console.log('Touch device detected:', this.isTouchDevice);
        console.log('Max touch points:', navigator.maxTouchPoints);
        console.log('ontouchstart available:', 'ontouchstart' in window);
        console.log('BLOCK_SIZE after updateCanvasSize:', this.BLOCK_SIZE);
        
        console.log('Calling createAvailablePieces...');
        this.createAvailablePieces();
        console.log('createAvailablePieces completed');
        
        console.log('Calling bindEvents...');
        this.bindEvents();
        console.log('bindEvents completed');
        
        console.log('Calling draw...');
        this.draw();
        console.log('draw completed');
        
        // Lyt til resize events for responsivt design
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => this.handleResize());
    }
    
    updateCanvasSize() {
        // Beregn responsiv block størrelse baseret på skærmstørrelse
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Bestem block størrelse baseret på skærmstørrelse - endnu mere responsivt
        let blockSize = 40; // Standard størrelse - dobbelt så stor
        
        if (screenWidth <= 320) {
            // Meget små skærme
            blockSize = Math.min(24, Math.floor(screenWidth * 0.6 / this.BOARD_WIDTH));
        } else if (screenWidth <= 480) {
            // Mobile telefoner
            blockSize = Math.min(30, Math.floor(screenWidth * 0.5 / this.BOARD_WIDTH));
        } else if (screenWidth <= 768) {
            // Tablets portrait
            blockSize = Math.min(36, Math.floor(screenWidth * 0.4 / this.BOARD_WIDTH));
        } else if (screenWidth <= 1024) {
            // Tablets landscape
            blockSize = Math.min(40, Math.floor(screenWidth * 0.3 / this.BOARD_WIDTH));
        } else {
            // Desktop
            blockSize = Math.min(44, Math.floor(screenWidth * 0.25 / this.BOARD_WIDTH));
        }
        
        // Sørg for at block størrelsen er mindst 40px og maksimalt 120px
        this.BLOCK_SIZE = Math.max(40, Math.min(120, blockSize));
        
        // Opdater canvas størrelse
        this.canvas.width = this.BOARD_WIDTH * this.BLOCK_SIZE;
        this.canvas.height = this.BOARD_HEIGHT * this.BLOCK_SIZE;
        
        // Opdater brikkernes størrelse hvis de allerede eksisterer
        if (this.availablePieces && this.availablePieces.length > 0) {
            this.availablePieces.forEach(piece => {
                piece.width = piece.shape[0].length * this.BLOCK_SIZE;
                piece.height = piece.shape.length * this.BLOCK_SIZE;
            });
        }
        
        console.log('Canvas størrelse opdateret:', this.canvas.width, 'x', this.canvas.height, 'Block size:', this.BLOCK_SIZE);
    }
    
    handleResize() {
        // Vent lidt før resize for at undgå for mange opdateringer
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            console.log('Handling resize...');
            this.updateCanvasSize();
            this.updatePieceCanvases();
            this.draw();
            console.log('Resize completed');
        }, 150);
    }
    
    updatePieceCanvases() {
        // Opdater alle brikkernes canvas størrelse
        const pieceElements = document.querySelectorAll('.piece-item');
        pieceElements.forEach(element => {
            if (element.piece && element.ctx) {
                const piece = element.piece;
                const ctx = element.ctx;
                
                // Opdater brikkens dimensioner
                piece.width = piece.shape[0].length * this.BLOCK_SIZE;
                piece.height = piece.shape.length * this.BLOCK_SIZE;
                
                // Opdater canvas størrelse
                ctx.canvas.width = piece.width;
                ctx.canvas.height = piece.height;
                
                // Tegn brikken igen
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                this.drawPieceOnCanvas(ctx, piece, 0, 0);
            }
        });
    }
    
    init() {
        console.log('Initialiserer spil...');
        this.createBoard();
        this.createAvailablePieces();
        this.bindEvents();
        this.draw();
        console.log('Spil initialiseret!');
    }
    
    createBoard() {
        const board = [];
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            board[y] = [];
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                board[y][x] = 0;
            }
        }
        return board;
    }
    
    // Tetris brikker definitioner
    getPieceShapes() {
        return {
            I: [
                [1, 1, 1, 1]
            ],
            O: [
                [1, 1],
                [1, 1]
            ],
            T: [
                [0, 1, 0],
                [1, 1, 1]
            ],
            S: [
                [0, 1, 1],
                [1, 1, 0]
            ],
            Z: [
                [1, 1, 0],
                [0, 1, 1]
            ],
            J: [
                [1, 0, 0],
                [1, 1, 1]
            ],
            L: [
                [0, 0, 1],
                [1, 1, 1]
            ]
        };
    }
    
    getPieceColors() {
        return [
            '#ff6b6b',    // Rød
            '#ffa726',    // Orange
            '#ffeb3b',    // Gul
            '#66bb6a',    // Grøn
            '#42a5f5',    // Blå
            '#ab47bc',    // Lilla
            '#ec407a'     // Pink
        ];
    }
    
    createAvailablePieces() {
        console.log('Opretter tilgængelige brikker...');
        console.log('BLOCK_SIZE:', this.BLOCK_SIZE);
        console.log('BOARD_WIDTH:', this.BOARD_WIDTH);
        console.log('BOARD_HEIGHT:', this.BOARD_HEIGHT);
        
        // Sikkerhedstjek for BLOCK_SIZE
        if (!this.BLOCK_SIZE || this.BLOCK_SIZE <= 0) {
            console.error('BLOCK_SIZE er ikke defineret eller 0:', this.BLOCK_SIZE);
            this.BLOCK_SIZE = 60; // Fallback værdi - dobbelt så stor
        }
        
        this.availablePieces = [];
        this.piecesArea.innerHTML = '';
        const pieces = Object.keys(this.getPieceShapes());
        
        console.log('Tilgængelige brik typer:', pieces);
        console.log('Pieces area element:', this.piecesArea);
        console.log('Pieces area element exists:', !!this.piecesArea);
        console.log('Pieces area element tagName:', this.piecesArea ? this.piecesArea.tagName : 'undefined');
        
        // Opret kun 2 tilfældige brikker til rådighed i stedet for 5
        for (let i = 0; i < 2; i++) {
            const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
            const piece = {
                id: i,
                type: randomPiece,
                shape: this.getPieceShapes()[randomPiece],
                color: this.getPieceColors()[Math.floor(Math.random() * this.getPieceColors().length)],
                width: this.getPieceShapes()[randomPiece][0].length * this.BLOCK_SIZE,
                height: this.getPieceShapes()[randomPiece].length * this.BLOCK_SIZE,
                originalX: 50 + (i * 80),
                originalY: 50
            };
            
            console.log('Opretter brik:', piece);
            this.availablePieces.push(piece);
            console.log('Tilføjer brik til availablePieces, antal nu:', this.availablePieces.length);
            const pieceElement = this.createPieceElement(piece);
            console.log('Piece element oprettet:', pieceElement);
            this.piecesArea.appendChild(pieceElement);
            console.log('Piece element tilføjet til piecesArea');
        }
        
        console.log('Antal brikker oprettet:', this.availablePieces.length);
        console.log('Pieces area HTML:', this.piecesArea.innerHTML);
        console.log('Pieces area children count:', this.piecesArea.children.length);
        console.log('Pieces area children:', this.piecesArea.children);
        console.log('Available pieces array:', this.availablePieces);
        console.log('Available pieces length:', this.availablePieces.length);
        console.log('Pieces area innerHTML length:', this.piecesArea.innerHTML.length);
        console.log('Pieces area innerHTML preview:', this.piecesArea.innerHTML.substring(0, 200));
        console.log('Pieces area computed style:', window.getComputedStyle(this.piecesArea));
        console.log('Pieces area display:', window.getComputedStyle(this.piecesArea).display);
        console.log('Pieces area visibility:', window.getComputedStyle(this.piecesArea).visibility);
        console.log('Pieces area opacity:', window.getComputedStyle(this.piecesArea).opacity);
        console.log('Pieces area height:', window.getComputedStyle(this.piecesArea).height);
        console.log('Pieces area width:', window.getComputedStyle(this.piecesArea).width);
        console.log('Pieces area position:', window.getComputedStyle(this.piecesArea).position);
        console.log('Pieces area z-index:', window.getComputedStyle(this.piecesArea).zIndex);
        console.log('Pieces area overflow:', window.getComputedStyle(this.piecesArea).overflow);
    }
    
    createPieceElement(piece) {
        console.log('Opretter piece element for:', piece.type);
        console.log('Piece shape:', piece.shape);
        console.log('Piece color:', piece.color);
        console.log('Canvas size:', piece.shape[0].length * this.BLOCK_SIZE, 'x', piece.shape.length * this.BLOCK_SIZE);
        
        const pieceElement = document.createElement('div');
        pieceElement.className = 'piece-item';
        pieceElement.draggable = true;
        pieceElement.style.position = 'relative'; // Sikrer at rotationsknappen forbliver på plads
        
        // Gør brikkerne mindre
        const pieceCanvas = document.createElement('canvas');
        const pieceCtx = pieceCanvas.getContext('2d');
        
        // Sikkerhedstjek for BLOCK_SIZE
        if (!this.BLOCK_SIZE || this.BLOCK_SIZE <= 0) {
            console.error('BLOCK_SIZE er ikke defineret eller 0:', this.BLOCK_SIZE);
            this.BLOCK_SIZE = 60; // Fallback værdi - dobbelt så stor
        }
        
        console.log('Creating canvas with BLOCK_SIZE:', this.BLOCK_SIZE);
        console.log('Piece shape dimensions:', piece.shape[0].length, 'x', piece.shape.length);
        
        pieceCanvas.width = piece.shape[0].length * this.BLOCK_SIZE;
        pieceCanvas.height = piece.shape.length * this.BLOCK_SIZE;
        
        console.log('Canvas created with size:', pieceCanvas.width, 'x', pieceCanvas.height);
        
        // Tegn brikken på canvas
        this.drawPieceOnCanvas(pieceCtx, piece, 0, 0);
        console.log('Piece drawn on canvas');
        
        // Tilføj rotation knap
        const rotateBtn = document.createElement('button');
        rotateBtn.textContent = '🔄';
        rotateBtn.className = 'rotate-btn';
        rotateBtn.style.cssText = `
            position: absolute;
            top: -24px;
            right: -24px;
            width: 56px;
            height: 56px;
            border: none;
            border-radius: 50%;
            background: linear-gradient(145deg, #ff6b6b, #ffa726, #ffeb3b, #66bb6a, #42a5f5, #ab47bc, #ec407a);
            color: white;
            cursor: pointer;
            font-size: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            z-index: 100;
            pointer-events: auto;
            -webkit-tap-highlight-color: transparent;
            transform: translateZ(0);
            will-change: transform;
        `;
        
        console.log('Rotation button created');
        
        // Hover effekt for rotation knap
        rotateBtn.addEventListener('mouseenter', () => {
            rotateBtn.style.transform = 'scale(1.1) rotate(180deg)';
            rotateBtn.style.background = 'linear-gradient(145deg, #ec407a, #ab47bc, #42a5f5, #66bb6a, #ffeb3b, #ffa726, #ff6b6b)';
        });
        
        rotateBtn.addEventListener('mouseleave', () => {
            rotateBtn.style.transform = 'scale(1) rotate(0deg)';
            rotateBtn.style.background = 'linear-gradient(145deg, #ff6b6b, #ffa726, #ffeb3b, #66bb6a, #42a5f5, #ab47bc, #ec407a)';
        });
        
        // Touch events for rotation knap på iPad
        rotateBtn.addEventListener('touchstart', (e) => {
            console.log('Rotation button touched');
            e.preventDefault();
            e.stopPropagation();
            this.rotatePiece(piece);
            this.updatePieceCanvas(piece, pieceCtx);
        });
        
        // Tilføj også click event for rotation knap
        rotateBtn.addEventListener('click', (e) => {
            console.log('Rotation button clicked');
            e.preventDefault();
            e.stopPropagation();
            this.rotatePiece(piece);
            this.updatePieceCanvas(piece, pieceCtx);
        });
        
        // Forhindre højreklik menu
        rotateBtn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        
        pieceElement.appendChild(pieceCanvas);
        pieceElement.appendChild(rotateBtn);
        
        console.log('Canvas and button added to piece element');
        
        // Gem referencer
        pieceElement.piece = piece;
        pieceElement.canvas = pieceCanvas;
        pieceElement.ctx = pieceCtx;
        
        console.log('References stored in piece element');
        
        // Drag events - forbedret for iPad
        pieceElement.addEventListener('mousedown', (e) => this.onPieceMouseDown(e, piece, pieceElement));
        pieceElement.addEventListener('touchstart', (e) => this.onTouchStart(e, piece, pieceElement));
        
        console.log('Event listeners added to piece element');
        
        // Tilføj touch-specifikke styles
        if (this.isTouchDevice) {
            pieceElement.style.webkitTapHighlightColor = 'transparent';
            pieceElement.style.webkitTouchCallout = 'none';
            pieceElement.style.webkitUserSelect = 'none';
            pieceElement.style.userSelect = 'none';
            pieceElement.style.touchAction = 'manipulation';
            pieceElement.style.webkitTouchAction = 'manipulation';
        }
        
        console.log('Piece element completed for:', piece.type);
        return pieceElement;
    }
    
    drawPieceOnCanvas(ctx, piece, offsetX, offsetY) {
        console.log('Drawing piece on canvas:', piece.type, 'BLOCK_SIZE:', this.BLOCK_SIZE);
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const blockX = (offsetX + x) * this.BLOCK_SIZE;
                    const blockY = (offsetY + y) * this.BLOCK_SIZE;
                    
                    console.log('Drawing block at:', blockX, blockY, 'color:', piece.color);
                    // Brug brikkens farve direkte
                    this.drawRoundedBlock(ctx, blockX, blockY, this.BLOCK_SIZE, piece.color);
                }
            }
        }
    }
    
    drawRoundedBlock(ctx, x, y, size, color) {
        console.log('Drawing rounded block at:', x, y, 'size:', size, 'color:', color);
        const radius = size * 0.15;
        
        // Tegn glød effekt
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Tegn afrundet rektangel (kompatibel version)
        ctx.fillStyle = color;
        ctx.beginPath();
        this.drawRoundedRect(ctx, x, y, size, size, radius);
        ctx.fill();
        
        // Tilføj highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        this.drawRoundedRect(ctx, x + 2, y + 2, size - 4, size - 4, radius - 2);
        ctx.fill();
        
        // Nulstil shadow
        ctx.shadowBlur = 0;
    }
    
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
    }
    
    drawBlock(x, y, color) {
        const blockX = x * this.BLOCK_SIZE;
        const blockY = y * this.BLOCK_SIZE;
        
        // Tegn blødere kanter med afrundede hjørner
        this.drawRoundedBlock(this.ctx, blockX, blockY, this.BLOCK_SIZE, color);
    }
    
    draw() {
        // Hurtigere tegning ved at rydde canvas først
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBoard();
        this.drawGrid();
    }
    
    drawBoard() {
        // Tegn placeret brikker (canvas er allerede ryddet i draw())
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    // Brug farven direkte fra board array
                    const color = this.board[y][x];
                    this.drawRoundedBlock(this.ctx, x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, this.BLOCK_SIZE, color);
                }
            }
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(233, 30, 99, 0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = 'round';
        
        // Tegn vertikale linjer
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Tegn horisontale linjer
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawPreview() {
        if (!this.selectedPiece) return;
        
        // Konverter mus position til bræt koordinater
        const boardX = Math.floor(this.dragPosition.x / this.BLOCK_SIZE);
        const boardY = Math.floor(this.dragPosition.y / this.BLOCK_SIZE);
        
        // Tjek om placeringen er gyldig
        const canPlace = this.canPlacePiece(this.selectedPiece, boardX, boardY);
        
        // Tegn preview med passende farve og bløde kanter
        this.ctx.globalAlpha = 0.6;
        
        for (let y = 0; y < this.selectedPiece.shape.length; y++) {
            for (let x = 0; x < this.selectedPiece.shape[y].length; x++) {
                if (this.selectedPiece.shape[y][x]) {
                    const previewColor = canPlace ? '#4CAF50' : '#f44336';
                    this.drawRoundedBlock(
                        this.ctx,
                        (boardX + x) * this.BLOCK_SIZE,
                        (boardY + y) * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        previewColor
                    );
                }
            }
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    canPlacePiece(piece, boardX, boardY) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = boardX + x;
                    const newY = boardY + y;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY < 0 || newY >= this.BOARD_HEIGHT ||
                        this.board[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    placePiece(piece, boardX, boardY) {
        // Placer brikken på brættet
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardYPos = boardY + y;
                    const boardXPos = boardX + x;
                    if (boardYPos >= 0 && boardYPos < this.BOARD_HEIGHT && 
                        boardXPos >= 0 && boardXPos < this.BOARD_WIDTH) {
                        // Gem brikkens farve i stedet for bare 1
                        this.board[boardYPos][boardXPos] = piece.color;
                    }
                }
            }
        }
        
        // Fjern brikken fra tilgængelige brikker
        const pieceIndex = this.availablePieces.findIndex(p => p.id === piece.id);
        if (pieceIndex !== -1) {
            this.availablePieces.splice(pieceIndex, 1);
        }
        
        // Fjern brikkens HTML element
        const pieceElements = document.querySelectorAll('.piece-item');
        let pieceElement = null;
        
        for (let element of pieceElements) {
            if (element.piece && element.piece.id === piece.id) {
                pieceElement = element;
                break;
            }
        }
        
        if (pieceElement) {
            pieceElement.remove();
        }
        
        // Generer nye brikker hvis der er færre end 2
        if (this.availablePieces.length < 2) {
            this.generateNewPieces();
        }
        
        // Opdater score og linjer hurtigt
        this.score += 10;
        this.updateScore();
        
        // Tjek om der skal ryddes linjer (hurtigere)
        this.clearLines();
        
        // Tjek om brættet skal ryddes
        this.clearBoardIfNeeded();
        
        // Genoptegn brættet med det samme
        this.draw();
        
        console.log('Brik placeret på position:', boardX, boardY);
        return true; // Returner success
    }
    
    generateNewPieces() {
        const pieces = Object.keys(this.getPieceShapes());
        const currentCount = this.availablePieces.length;
        const neededCount = 2 - currentCount;
        
        for (let i = 0; i < neededCount; i++) {
            const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
            const piece = {
                id: Date.now() + i, // Unikt ID
                type: randomPiece,
                shape: this.getPieceShapes()[randomPiece],
                color: this.getPieceColors()[Math.floor(Math.random() * this.getPieceColors().length)],
                width: this.getPieceShapes()[randomPiece][0].length * this.BLOCK_SIZE,
                height: this.getPieceShapes()[randomPiece].length * this.BLOCK_SIZE,
                originalX: 50 + (i * 80),
                originalY: 50
            };
            
            this.availablePieces.push(piece);
            const pieceElement = this.createPieceElement(piece);
            this.piecesArea.appendChild(pieceElement);
        }
        
        console.log('Nye brikker genereret. Total antal:', this.availablePieces.length);
    }
    
    clearLines() {
        let linesCleared = 0;
        const linesToClear = [];
        
        // Find alle linjer der skal ryddes
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                linesToClear.push(y);
            }
        }
        
        if (linesToClear.length > 0) {
            // Vis feedback før rydning
            this.showLineClearFeedback(linesToClear);
            
            // Ryd linjerne hurtigt - sorteret fra bund til top for korrekt rydning
            linesToClear.sort((a, b) => b - a).forEach(lineY => {
                this.board.splice(lineY, 1);
                this.board.unshift(new Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
            });
            
            // Opdater score og level hurtigt
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            
            // Opdater UI med det samme
            this.updateScore();
            
            // Tegn brættet igen med det samme
            this.draw();
            
            // Vis score feedback
            this.showScoreFeedback(linesCleared);
            
            // Spil lyd effekt hvis muligt
            this.playLineClearSound(linesCleared);
        }
    }
    
    showLineClearFeedback(linesToClear) {
        // Flash effekt for linjer der bliver ryddet
        this.ctx.save();
        this.ctx.globalAlpha = 0.9;
        this.ctx.fillStyle = '#ffff00';
        
        linesToClear.forEach(lineY => {
            this.ctx.fillRect(0, lineY * this.BLOCK_SIZE, this.canvas.width, this.BLOCK_SIZE);
        });
        
        this.ctx.restore();
        
        // Hurtigere animation - tegn brættet igen efter meget kort pause
        setTimeout(() => {
            this.draw();
        }, 50); // Reduceret fra 100ms til 50ms
    }
    
    showScoreFeedback(linesCleared) {
        // Vis score feedback
        const scoreElement = document.createElement('div');
        scoreElement.textContent = `+${linesCleared * 100 * this.level} points!`;
        scoreElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #ff6b6b, #ffa726, #ffeb3b, #66bb6a, #42a5f5, #ab47bc, #ec407a);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 24px;
            font-weight: bold;
            z-index: 2000;
            pointer-events: none;
            animation: scorePopup 1s ease-out forwards;
        `;
        
        // Tilføj CSS animation
        if (!document.getElementById('scoreAnimation')) {
            const style = document.createElement('style');
            style.id = 'scoreAnimation';
            style.textContent = `
                @keyframes scorePopup {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(scoreElement);
        
        // Fjern elementet efter animation
        setTimeout(() => {
            if (scoreElement.parentNode) {
                scoreElement.parentNode.removeChild(scoreElement);
            }
        }, 1000);
    }
    
    playLineClearSound(linesCleared) {
        // Simpel lyd effekt ved hjælp af Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Forskellige toner baseret på antal ryddede linjer
            const frequencies = [440, 554, 659, 740]; // A, C#, E, F#
            const frequency = frequencies[Math.min(linesCleared - 1, 3)];
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            // Ignorer lyd fejl hvis Web Audio API ikke er tilgængelig
            console.log('Lyd ikke tilgængelig:', e);
        }
    }
    
    // Ny funktion til at rydde brættet hvis det bliver for fuldt
    clearBoardIfNeeded() {
        // Tæl antal fyldte felter
        let filledCells = 0;
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    filledCells++;
                }
            }
        }
        
        // Hvis mere end 80% af brættet er fyldt, ryd det
        const totalCells = this.BOARD_WIDTH * this.BOARD_HEIGHT;
        if (filledCells > totalCells * 0.8) {
            this.board = this.createBoard();
            console.log('Bræt ryddet - fortsæt spillet!');
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    updateScore() {
        // Opdater score display hvis det findes
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
        
        // Opdater level display hvis det findes
        const levelElement = document.getElementById('level');
        if (levelElement) {
            levelElement.textContent = this.level;
        }
        
        // Opdater lines display hvis det findes
        const linesElement = document.getElementById('lines');
        if (linesElement) {
            linesElement.textContent = this.lines;
        }
    }
    
    bindEvents() {
        // Canvas events
        this.canvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onCanvasMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => this.onCanvasMouseLeave());
        
        // Touch events for mobile/iPad - forbedret
        this.canvas.addEventListener('touchstart', (e) => this.onCanvasTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onCanvasTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onCanvasTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', () => this.onCanvasTouchCancel());
        
        // Global events
        document.addEventListener('mousemove', (e) => this.onGlobalMouseMove(e));
        document.addEventListener('mouseup', () => this.onGlobalMouseUp());
        document.addEventListener('touchmove', (e) => this.onGlobalTouchMove(e), { passive: false });
        document.addEventListener('touchend', () => this.onGlobalTouchEnd());
        
        // Forhindre zoom og scroll på iPad
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Forbedret touch handling for iPad
        document.addEventListener('touchmove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());
        
        // Forhindre context menu på iPad
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.piecesArea.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    
    onMouseDown(e, piece, pieceElement) {
        e.preventDefault();
        this.startDrag(e, piece, pieceElement);
    }
    
    onTouchStart(e, piece, pieceElement) {
        console.log('Touch start detected for piece:', piece.type);
        e.preventDefault();
        e.stopPropagation();
        
        // Forbedret touch handling for iPad
        if (e.touches.length > 1) {
            console.log('Multi-touch detected, ignoring');
            return; // Ignorer multi-touch
        }
        
        const touch = e.touches[0];
        console.log('Touch position:', touch.clientX, touch.clientY);
        
        // Gem touch start tid og position for at undgå uønskede drags
        this.touchStartTime = Date.now();
        this.touchStartPosition = { x: touch.clientX, y: touch.clientY };
        
        // Start drag med det samme - ingen forsinkelse for bedre følsomhed
        console.log('Starting drag from touch');
        this.startDrag(touch, piece, pieceElement);
    }
    
    onPieceMouseDown(e, piece, pieceElement) {
        if (e.target.tagName === 'BUTTON') {
            return; // Ignorer hvis der klikkes på en knap
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        this.startDrag(e, piece, pieceElement);
    }
    
    startDrag(e, piece, pieceElement) {
        console.log('Starting drag for piece:', piece.type);
        console.log('Event type:', e.type);
        console.log('Is touch device:', this.isTouchDevice);
        
        this.isDragging = true;
        this.selectedPiece = piece;
        
        // Beregn offset fra musens/touch position til brikkens position
        const rect = pieceElement.getBoundingClientRect();
        const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
        const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
        
        this.dragOffset = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
        
        // Gem brikkens oprindelige position
        piece.originalX = rect.left;
        piece.originalY = rect.top;
        
        // Gør brikken gennemsigtig under drag
        pieceElement.style.opacity = '0.7';
        
        // Tilføj touch-specifikke styles
        if (this.isTouchDevice) {
            pieceElement.style.pointerEvents = 'none';
            pieceElement.style.touchAction = 'none';
            pieceElement.style.webkitTouchAction = 'none';
        }
        
        console.log('Drag started, offset:', this.dragOffset);
    }
    
    onGlobalMouseMove(e) {
        if (this.isDragging && this.selectedPiece) {
            this.updateDragPosition(e.clientX, e.clientY);
        }
    }
    
    onGlobalMouseUp() {
        if (this.isDragging && this.selectedPiece) {
            this.endDrag();
        }
    }
    
    onCanvasMouseMove(e) {
        if (this.isDragging && this.selectedPiece) {
            this.updateDragPosition(e.clientX, e.clientY);
        }
    }
    
    onCanvasMouseUp(e) {
        if (this.isDragging && this.selectedPiece) {
            this.endDrag();
        }
    }
    
    onCanvasMouseLeave() {
        if (this.isDragging && this.selectedPiece) {
            this.endDrag();
        }
    }
    
    onGlobalTouchMove(e) {
        if (this.isDragging && this.selectedPiece) {
            console.log('Global touch move detected');
            e.preventDefault(); // Forhindre scroll under drag
            const touch = e.touches[0];
            this.updateDragPosition(touch.clientX, touch.clientY);
        }
    }
    
    onGlobalTouchEnd() {
        if (this.isDragging && this.selectedPiece) {
            console.log('Global touch end detected');
            // Tjek om det var en kort touch (ikke drag)
            const touchDuration = Date.now() - this.touchStartTime;
            const touchDistance = Math.sqrt(
                Math.pow(this.touchStartPosition.x - this.dragPosition.x, 2) +
                Math.pow(this.touchStartPosition.y - this.dragPosition.y, 2)
            );
            
            console.log('Touch duration:', touchDuration, 'ms');
            console.log('Touch distance:', touchDistance, 'px');
            
            // Hvis det var en kort touch med lille bevægelse, ignorer det
            if (touchDuration < 50 && touchDistance < 2) { // Meget mindre tolerance for bedre følsomhed
                console.log('Short touch detected, ignoring drag');
                this.isDragging = false;
                this.selectedPiece = null;
                this.returnPieceToOriginal();
                return;
            }
            
            console.log('Ending drag from touch');
            this.endDrag();
        }
    }
    
    onCanvasTouchStart(e) {
        console.log('Canvas touch start detected');
        e.preventDefault();
        e.stopPropagation();
        // Hvis vi ikke er i gang med at trække en brik, ignorer touch på canvas
        if (!this.isDragging) {
            console.log('Not dragging, ignoring canvas touch');
            return;
        }
        
        // Gem touch start position for canvas
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            this.touchStartPosition = { x: touch.clientX, y: touch.clientY };
            console.log('Canvas touch position:', touch.clientX, touch.clientY);
        }
    }
    
    onCanvasTouchMove(e) {
        if (this.isDragging && this.selectedPiece) {
            console.log('Canvas touch move detected');
            e.preventDefault(); // Forhindre scroll under drag
            e.stopPropagation();
            
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                // Opdater position med det samme for bedre følsomhed
                this.updateDragPosition(touch.clientX, touch.clientY);
            }
        }
    }
    
    onCanvasTouchEnd(e) {
        if (this.isDragging && this.selectedPiece) {
            console.log('Canvas touch end detected');
            e.preventDefault();
            this.endDrag();
        }
    }
    
    onCanvasTouchCancel() {
        if (this.isDragging && this.selectedPiece) {
            console.log('Canvas touch cancel detected');
            this.returnPieceToOriginal();
            this.isDragging = false;
            this.selectedPiece = null;
            this.draw();
        }
    }
    
    endDrag() {
        if (!this.selectedPiece) return;
        
        // Konverter til bræt koordinater
        const boardX = Math.floor(this.dragPosition.x / this.BLOCK_SIZE);
        const boardY = Math.floor(this.dragPosition.y / this.BLOCK_SIZE);
        
        console.log('Dropping piece at:', boardX, boardY);
        
        // Tjek om brikken kan placeres
        if (this.canPlacePiece(this.selectedPiece, boardX, boardY)) {
            // Placer brikken
            this.placePiece(this.selectedPiece, boardX, boardY);
            console.log('Brik placeret succesfuldt!');
        } else {
            // Returner brikken til sin oprindelige position
            this.returnPieceToOriginal();
        }
        
        // Ryd drag state
        this.isDragging = false;
        this.selectedPiece = null;
        
        // Nulstil touch state
        this.touchStartTime = 0;
        this.touchStartPosition = { x: 0, y: 0 };
        
        // Genoptegn brættet
        this.draw();
    }
    
    returnPieceToOriginal() {
        if (!this.selectedPiece) return;
        
        // Find brikkens HTML element
        const pieceElements = document.querySelectorAll('.piece-item');
        let pieceElement = null;
        
        for (let element of pieceElements) {
            if (element.piece && element.piece.id === this.selectedPiece.id) {
                pieceElement = element;
                break;
            }
        }
        
        if (pieceElement) {
            // Gendan brikkens oprindelige udseende
            pieceElement.style.opacity = '1';
            pieceElement.style.position = 'static';
            pieceElement.style.left = '';
            pieceElement.style.top = '';
            pieceElement.style.zIndex = '';
            
            // Sikre at rotationsknappen forbliver fast på brikken
            const rotateBtn = pieceElement.querySelector('.rotate-btn');
            if (rotateBtn) {
                rotateBtn.style.position = 'absolute';
                rotateBtn.style.top = '-24px';
                rotateBtn.style.right = '-24px';
                rotateBtn.style.zIndex = '100';
            }
            
            // Gendan touch styles
            if (this.isTouchDevice) {
                pieceElement.style.pointerEvents = 'auto';
                pieceElement.style.touchAction = 'manipulation';
                pieceElement.style.webkitTouchAction = 'manipulation';
            }
        }
        
        console.log('Brik returneret til oprindelig position');
    }
    
    updateDragPosition(clientX, clientY) {
        if (!this.isDragging || !this.selectedPiece) return;
        
        // Beregn position på canvas
        const canvasRect = this.canvas.getBoundingClientRect();
        this.dragPosition = {
            x: clientX - canvasRect.left,
            y: clientY - canvasRect.top
        };
        
        // Find og opdater brikkens HTML element position
        const pieceElements = document.querySelectorAll('.piece-item');
        let pieceElement = null;
        
        for (let element of pieceElements) {
            if (element.piece && element.piece.id === this.selectedPiece.id) {
                pieceElement = element;
                break;
            }
        }
        
        if (pieceElement) {
            pieceElement.style.position = 'fixed';
            pieceElement.style.left = (clientX - this.dragOffset.x) + 'px';
            pieceElement.style.top = (clientY - this.dragOffset.y) + 'px';
            pieceElement.style.zIndex = '1000';
            
            // Sikre at rotationsknappen forbliver fast på brikken
            const rotateBtn = pieceElement.querySelector('.rotate-btn');
            if (rotateBtn) {
                rotateBtn.style.position = 'absolute';
                rotateBtn.style.top = '-24px';
                rotateBtn.style.right = '-24px';
                rotateBtn.style.zIndex = '1001';
            }
            
            // Tilføj touch-specifikke styles for iPad
            if (this.isTouchDevice) {
                pieceElement.style.pointerEvents = 'none';
                pieceElement.style.userSelect = 'none';
                pieceElement.style.webkitUserSelect = 'none';
                pieceElement.style.touchAction = 'none';
                pieceElement.style.webkitTouchAction = 'none';
            }
        }
        
        // Tegn preview på canvas - altid opdater for bedre følsomhed
        this.drawPreview();
    }
    
    drawPreview() {
        if (!this.isDragging || !this.selectedPiece) return;
        
        // Ryd canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Tegn brættet
        this.drawBoard();
        
        // Tegn gitter
        this.drawGrid();
        
        // Beregn bræt koordinater
        const boardX = Math.floor(this.dragPosition.x / this.BLOCK_SIZE);
        const boardY = Math.floor(this.dragPosition.y / this.BLOCK_SIZE);
        
        // Tjek om brikken kan placeres
        const canPlace = this.canPlacePiece(this.selectedPiece, boardX, boardY);
        
        // Tegn preview
        this.drawPiecePreview(this.selectedPiece, boardX, boardY, canPlace);
    }
    
    drawPiecePreview(piece, boardX, boardY, canPlace) {
        const color = canPlace ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 0, 0, 0.6)';
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const blockX = (boardX + x) * this.BLOCK_SIZE;
                    const blockY = (boardY + y) * this.BLOCK_SIZE;
                    
                    if (blockX >= 0 && blockX < this.canvas.width && 
                        blockY >= 0 && blockY < this.canvas.height) {
                        this.drawRoundedBlock(this.ctx, blockX, blockY, this.BLOCK_SIZE, color);
                    }
                }
            }
        }
    }
    
    canPlacePiece(piece, boardX, boardY) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = boardX + x;
                    const newY = boardY + y;
                    
                    // Tjek om positionen er uden for brættet
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY < 0 || newY >= this.BOARD_HEIGHT) {
                        return false;
                    }
                    
                    // Tjek om positionen allerede er optaget
                    if (this.board[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    rotatePiece(piece) {
        const rows = piece.shape.length;
        const cols = piece.shape[0].length;
        const rotated = [];
        
        // Opret roteret matrix
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = piece.shape[rows - 1 - j][i];
            }
        }
        
        // Gem original position
        const originalX = piece.originalX;
        const originalY = piece.originalY;
        
        // Opdater brik
        piece.shape = rotated;
        
        // Gendan position
        piece.originalX = originalX;
        piece.originalY = originalY;
        
        console.log('Brik roteret:', piece.type);
    }
    
    updatePieceCanvas(piece, ctx) {
        // Gem canvas dimensioner før opdatering
        const originalWidth = ctx.canvas.width;
        const originalHeight = ctx.canvas.height;
        
        // Opdater brikkens dimensioner
        piece.width = piece.shape[0].length * this.BLOCK_SIZE;
        piece.height = piece.shape.length * this.BLOCK_SIZE;
        
        // Opdater canvas størrelse hvis nødvendigt
        if (ctx.canvas.width !== piece.width) {
            ctx.canvas.width = piece.width;
        }
        if (ctx.canvas.height !== piece.height) {
            ctx.canvas.height = piece.height;
        }
        
        // Ryd canvas og tegn brikken igen
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.drawPieceOnCanvas(ctx, piece, 0, 0);
        
        console.log('Piece canvas opdateret:', piece.type, 'Størrelse:', piece.width, 'x', piece.height);
    }
}

// Start spillet når siden er loaded
let game;
console.log('Setting up window load listener...');
window.addEventListener('load', () => {
    console.log('Side loaded, starter spil...');
    try {
        game = new TetrisPuzzle();
        console.log('Game created successfully!');
    } catch (error) {
        console.error('Error creating game:', error);
    }
});

// Genstart funktion
function restartGame() {
    console.log('Genstarter spil...');
    game = new TetrisPuzzle();
}
