import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon,Circle, Line } from 'react-native-svg';
import { PanGestureHandler, GestureHandlerRootView ,State } from 'react-native-gesture-handler';
const { width, height } = Dimensions.get('window');

function makeQuad(cx, cy, size) {
  const s = size / 2;
  return [
    { x: cx - s, y: cy - s },
    { x: cx + s, y: cy - s },
    { x: cx + s, y: cy + s },
    { x: cx - s, y: cy + s },
  ];
}

 function makeFruit() {
    const size = 80 + Math.random()*40;
    const cx   = Math.random()*(width-size) + size/2;
    const cy   = height + size/2;
    return {
      pts: makeQuad(cx, cy, size),
      vx:  (Math.random()-0.5)*200,
      vy: - (780 + Math.random()*400),
    };
  }

function segmentIntersectionPoint(x1,y1,x2,y2, x3,y3,x4,y4) {
  // Line AB represented parametrically: A + t*(B−A)
  const dx1 = x2-x1, dy1 = y2-y1;
  const dx2 = x4-x3, dy2 = y4-y3;
  const denom = dx1*dy2 - dy1*dx2;
  if (denom === 0) return null;              // parallel or collinear
  const t = ((x3-x1)*dy2 - (y3-y1)*dx2) / denom;
  const u = ((x3-x1)*dy1 - (y3-y1)*dx1) / denom;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: x1 + t*dx1, y: y1 + t*dy1 };
  }
  return null;
}

function lineHitsSegment(ax, ay, bx, by, cx, cy, dx, dy) {
  const dx1 = bx - ax, dy1 = by - ay;  // AB vector
  const dx2 = dx - cx, dy2 = dy - cy;  // CD vector

  // Solve A + t*(B−A) = C + u*(D−C)
  const denom = dx1 * dy2 - dy1 * dx2;
  if (denom === 0) return null;          // parallel or collinear

  // parameters
  const t = ((cx - ax) * dy2 - (cy - ay) * dx2) / denom;
  const u = ((cx - ax) * dy1 - (cy - ay) * dx1) / denom;

  // only care if intersection lies *on* CD  
  if (u < 0 || u > 1) return null;

  // return the point on the infinite line
  return { x: ax + t * dx1, y: ay + t * dy1 };
}

// >0 on left side, <0 on right side, =0 on the line
function sideOfLine(px,py, ax,ay, bx,by) {
  return (bx-ax)*(py-ay) - (by-ay)*(px-ax);
}


function sliceQuad(quadPts, cutA, cutB) {
  const polyA = [],intersections = [], polyB = [];
  // split into two statements:
  
const ax = cutA[0], 
        ay = cutA[1], 
        bx = cutB[0], 
        by = cutB[1];

  // 1. compute side for each vertex
  const sides = quadPts.map(p =>
    sideOfLine(p.x, p.y, ax, ay, bx, by)
  );

  // 2. walk the cycle of edges
  for (let i = 0; i < quadPts.length; i++) {
    const curr     = quadPts[i];
    const next     = quadPts[(i+1) % quadPts.length];
    const currSide = sides[i];
    const nextSide = sides[(i+1) % sides.length];

    // 2a) First, add the current point to its side
    if (currSide >= 0) polyA.push(curr);
    if (currSide <= 0) polyB.push(curr);

    // 2b) Then, if it crosses, insert the intersection
    if (currSide * nextSide < 0) {
      const I = segmentIntersectionPoint(
      ax, ay, bx, by,
      curr.x, curr.y, next.x, next.y
    );
      //console.log('  intersection? →', I);
      if (I) {
        polyA.push(I);
        polyB.push(I);
        intersections.push(I);
      }
    }
    // Note: we do *not* add `next` here—`next` will become `curr` in the next loop iteration
  }

  return { polyA, polyB,intersections };
}


function makeStartQuad()
{
  // 1) How big is each quad?
const size = 80;                // 80 px square

// 2) Where does it start?
//    Horizontally centered, just below the bottom edge
const startX = width  / 2;
const startY = height + size/2; 

// 3) How fast does it launch?
//    A little random side‐to‐side, and straight up at 300–500 px/sec
const initialVx = (Math.random() - 0.5) * 100;        // ±50 px/s
const initialVy = - (800 + Math.random() * 200);     // –300 to –500 px/s

  return {
    id: '0',
    pts: makeQuad(startX, startY, size),
    vx: initialVx,
    vy: initialVy,
    isSliced: false,
  };
}
export default function App() {
  
  const [slicePoints, setSlicePoints] = useState([]);
  const [debugDots, setDebugDots] = useState([]);

   // Example quad corners
  const scale = 150;
  const x1 = width  * 0.5, y1 = height * 0.5;
  const x2 = x1 + scale,  y2 = y1;
  const x3 = x2,         y3 = y1 + scale;
  const x4 = x1,         y4 = y3;

// Your quad’s corners in sequence (clockwise or counter‐clockwise)
const quadPts = [
  { x: x1, y: y1 },  // top-left
  { x: x2, y: y2 },  // top-right
  { x: x3, y: y3 },  // bottom-right
  { x: x4, y: y4 },  // bottom-left
];


const [quads, setQuads] = useState([
  makeStartQuad()
]);
  
const slicePointsRef          = useRef([]);
  const [_, forceRerender]      = useState(0);
 const lastTimestamp = useRef(null);



  // at top-level, alongside your refs and state:
const SLICE_INTERVAL = 150;              // ms between slice checks

// gravity acceleration (px/s²)
const GRAVITY = 1200;
// how often to spawn a new fruit (ms)
const SPAWN_INTERVAL = 800;

const lastSliceTime  = useRef(0);
const lastPtRef   = useRef(null);



useEffect(() => {
  let last = Date.now();
 let mounted = true;
 function frame() {
    //console.log("sd");
    if (!mounted) return;
    const now = Date.now();
    const dt  = (now - last) / 1000;
    last = now;

    setQuads(old => {
      // 1) Advance & drop any sliced‐off pieces
      const advanced = old.flatMap(f => {
        // integrate physics
        const newPts = f.pts.map(p => ({
          x: p.x + f.vx * dt,
          y: p.y + f.vy * dt + 0.5 * GRAVITY * dt * dt
        }));
        const newVy = f.vy + GRAVITY * dt;

        // if the piece was sliced, or has fallen off screen, drop it
        if (Math.min(...newPts.map(p => p.y)) > height + 50) {
          return [];
        }

        // otherwise keep it flying
        return [{ ...f, pts: newPts, vy: newVy }];
      });

      // 2) If nothing remains, spawn a fresh one
      if (advanced.length === 0) {
        return [ makeStartQuad() ];
      }

      return advanced;
    });

    
    requestAnimationFrame(frame);
  }
  const id = requestAnimationFrame(frame);
  return () => { mounted = false; };
  return () => cancelAnimationFrame(id);
}, []);





// …

const onGestureEvent = ({ nativeEvent:{ x, y } }) => {
  const now  = Date.now();
  const last = lastPtRef.current;
  setSlicePoints(p => [...p, { x, y }]);
  if (!last || now - lastSliceTime.current < SLICE_INTERVAL) {
    lastPtRef.current = { x, y };
    return;
  }
  const SWIPE_PADDING = 150;
  lastSliceTime.current = now;
 const dx = x - last.x, dy = y - last.y;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      const ux = dx / len, uy = dy / len;

      // extend both ends by SWIPE_PADDING
      const A = [ last.x - ux * SWIPE_PADDING, last.y - uy * SWIPE_PADDING ];
      const B = [ x        + ux * SWIPE_PADDING, y        + uy * SWIPE_PADDING ];
  setQuads(old =>
    old.flatMap(f => {
      const { polyA, polyB, intersections } = sliceQuad(f.pts, A, B);
      if (intersections.length >= 2) {
        // split into two flying halves
        return [
          { id: f.id+'a', pts: polyA, vx: f.vx - 50, vy: f.vy - 200, isSliced : true},
          { id: f.id+'b', pts: polyB, vx: f.vx + 50, vy: f.vy - 200, isSliced : true},
        ];
      }
      return [f];  // untouched
    })
  );

  lastPtRef.current = { x, y };
}
};

const onHandlerStateChange = ({ nativeEvent }) => {
  if (
    nativeEvent.state === State.END ||
    nativeEvent.state === State.CANCELLED
  ) {
    // reset both refs
    lastPtRef.current     = null;
    lastSliceTime.current = 0;
        setSlicePoints([]);
  }
};
  

  return (
    <GestureHandlerRootView style={styles.flex}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <View style={styles.flex}>
<Svg width={width} height={height} style={{flex:1}}>
  {quads.map(f => (
    <Polygon
      key={f.id}
      points={f.pts.map(p=>`${p.x},${p.y}`).join(' ')}
      fill="orange"
      stroke="black"
      strokeWidth={2}
    />
  ))}
</Svg>

        <Svg style={StyleSheet.absoluteFill}>
          
          {slicePoints.length > 1 && (
            <Line
              x1={slicePoints[slicePoints.length-2].x}
              y1={slicePoints[slicePoints.length-2].y}
              x2={slicePoints[slicePoints.length-1].x}
              y2={slicePoints[slicePoints.length-1].y}
              stroke="red"
              strokeWidth={5}
            />
          )}
        </Svg>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
  
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: '#fafafa' },
  flex:      { flex: 1 },        // ← add this
});