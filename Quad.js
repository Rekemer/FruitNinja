function MakeQuad(cx, cy, size) {
    const s = size / 2;
    return [
        { x: cx - s, y: cy - s },
        { x: cx + s, y: cy - s },
        { x: cx + s, y: cy + s },
        { x: cx - s, y: cy + s },
    ];
}


// move each point fractionally toward the centroid
function insetPoly(pts, insetFraction) {
  const cx = pts.reduce((sum,p)=> sum+p.x,0) / pts.length;
  const cy = pts.reduce((sum,p)=> sum+p.y,0) / pts.length;
  return pts.map(p => ({
    x: cx + (p.x - cx) * (1 - insetFraction),
    y: cy + (p.y - cy) * (1 - insetFraction),
  }));
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


// random spin
  const initialAngle      = Math.random()*360;
  const aVel   = (Math.random() - 0.5)*360;
  const pts = MakeQuad(startX, startY, size);
    return {
        id: '0',
        pts,
        vx: initialVx,
        vy: initialVy,
        isSliced: false,
         angle: initialAngle,
         SWIPE_INTERVAL:150,
         lastSliceTimeRef : 0,
    aVel,
    pivot: { x: startX, y: startY }, 
        imageUri: imageUri, 
        imageBox: {
            x: startX - size / 2,
            y: startY - size / 2,
            w: size,
            h: size,
        }
    };
}