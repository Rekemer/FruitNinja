function MakeQuad(cx, cy, size) {
    const s = size / 2;
    return [
        { x: cx - s, y: cy - s },
        { x: cx + s, y: cy - s },
        { x: cx + s, y: cy + s },
        { x: cx - s, y: cy + s },
    ];
}



export function MakeStartQuad(width, height) {

    const size = 120;                

    const startX = width / 2;
    const startY = height + size / 2;

    const initialVx = (Math.random() - 0.5) * 100;        
    const initialVy = - (800 + Math.random() * 200);    

    const Pear = require('./assets/pear.png');
    const Apple = require('./assets/strawberry.png');
    const Banana = require('./assets/banana.png');

    const FRUITS = [Pear, Apple, Banana];

    const imageUri = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    return {
        id: '0',
        pts: MakeQuad(startX, startY, size),
        vx: initialVx,
        vy: initialVy,
        isSliced: false,
        imageUri: imageUri, 
        imageBox: {
            x: startX - size / 2,
            y: startY - size / 2,
            w: size,
            h: size
        }

    };
}