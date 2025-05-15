import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon,Circle, Line } from 'react-native-svg';
import { PanGestureHandler, GestureHandlerRootView ,State } from 'react-native-gesture-handler';
const { width, height } = Dimensions.get('window');


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
  const [ax, ay] = cutA, [bx, by] = cutB;

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
      const I = lineHitsSegment(
      ax, ay, bx, by,
      curr.x, curr.y, next.x, next.y
    );
      console.log('  intersection? →', I);
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



export default function App() {
  
  const [slicePoints, setSlicePoints] = useState([]);
  const [debugDots, setDebugDots] = useState([]);
  const spawnInterval = useRef(null);

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
    { id: 0, pts: quadPts }
  ]);


  useEffect(() => {
    spawnInterval.current = setInterval(spawnFruit, 1500);
    return () => clearInterval(spawnInterval.current);
  }, []);

  const spawnFruit = () => {
    // TODO: randomize x, velocity, color, radius & push into `fruits`
  };

  const onGestureEvent = ({ nativeEvent: { x, y } }) => {
    setSlicePoints(p => [...p, { x, y }]);
  };

  const onHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END && slicePoints.length >= 2) {
    const last = slicePoints.at(-1);
    const prev = slicePoints.at(-3);
    //console.log("last",last);
    //console.log("prev",prev);
    // slice just the original quad:
    const { polyA, polyB,intersections } = sliceQuad(
      quadPts,
      [prev.x, prev.y],
      [last.x, last.y]
    );

    setQuads([
      { id: 1, pts: polyA },
      { id: 2, pts: polyB }
    ]);
    setSlicePoints([]);
    console.log("intersections", intersections);
    console.log("polyA", polyA);
    console.log("polyB", polyB);
    setDebugDots(intersections);
  }
  };

  return (
    <GestureHandlerRootView>

<PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <View style={styles.container}>
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
        <Svg style={StyleSheet.absoluteFill}>
  {/* Example: Render a quad (arbitrary quadrilateral) */}
  {/* <Polygon
    points={`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`}
    fill="rgba(255,0,0,0.3)"
    stroke="red"
    strokeWidth={2}
  /> */}
{quads.map(q => (
  <Polygon
    key={q.id}
    points={ q.pts.map(p => `${p.x},${p.y}`).join(' ') }
    fill={q.id ==1 ? 'rgba(255,0,255,0.3)':'rgba(0,0,255,0.3)'}
    stroke="black"
    strokeWidth={2}
  />
))}
{/* debug: intersection points */}
{debugDots.map((p, i) => (
  <Circle
    key={`dot${i}`}
    cx={p.x}
    cy={p.y}
    r={5}
    fill="red"
  />
))}
</Svg>
      </View>
    </PanGestureHandler>

    </GestureHandlerRootView>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
