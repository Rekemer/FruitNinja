import { useState, useEffect, useRef } from 'react';
import { ImageBackground, View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line} from 'react-native-svg';
import { PanGestureHandler, GestureHandlerRootView, State } from 'react-native-gesture-handler';



import { MakeStartQuad } from './Quad'
import { ProcessSwipeSlice } from './Slice'
import { RenderFlashes, RenderQuads } from './Rendering'

const { width, height } = Dimensions.get('window');



function AdvanceQuads(oldQuads, dt, width, height) {
  // gravity acceleration (px/s²)
  const GRAVITY = 1000;
  // update positions
  const advanced = oldQuads.flatMap(f => {
    const dx = f.vx * dt;
    const dy = f.vy * dt + 0.5 * GRAVITY * dt * dt;
    const newPts = f.pts.map(p => ({
      x: p.x + dx,
      y: p.y + dy,
    }));
    const newVy = f.vy + GRAVITY * dt;

    // off-screen, drop:
    if (Math.min(...newPts.map(p => p.y)) > height + 50) {
      return [];
    }
const newAngle = (f.angle + f.aVel*dt) % 360;
        // move pivot along:
        const newPivot = { x: f.pivot.x + dx, y: f.pivot.y + dy };
    // otherwise keep flying:
    return [{
      ...f,
      pts: newPts,
      vy: newVy,
       angle: newAngle,
          pivot: newPivot,
      imageBox: {
        x: f.imageBox.x + dx,
        y: f.imageBox.y + dy,
        w: f.imageBox.w,
        h: f.imageBox.h,
      }
    }];
  });

  // spawn a new one since nothing is on the screen
  if (advanced.length === 0) {
    return [MakeStartQuad(width, height)];
  }
  return advanced;
}

export default function App() {

  const [slicePoints, setSlicePoints] = useState([]);


  const [quads, setQuads] = useState([
    MakeStartQuad(width, height)
  ]);


  const lastPtRef = useRef(null);
  const [flashes, setFlashes] = useState([])

  useEffect(() => {
    let last = Date.now();
    let mounted = true;

    function frame() {
      if (!mounted) return;
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;

      setQuads(old =>
        AdvanceQuads(old, dt, width, height)
      );

      requestAnimationFrame(frame);
    }

    const id = requestAnimationFrame(frame);
    return () => { mounted = false; };
  }, []);




  const onGestureEvent = ({ nativeEvent: { x, y } }) => {
    const now = Date.now()
    const last = lastPtRef.current
    setSlicePoints(p => [...p, { x, y }])

    if (!last) {
      lastPtRef.current = { x, y }
      return
    }

    const dx = x - last.x
    const dy = y - last.y
    const len = Math.hypot(dx, dy)
    if (len === 0) return

    
    // build segment
    const ux = dx / len, uy = dy / len
    // extend segment 
    const SWIPE_PADDING = 150


    const A = [last.x - ux * SWIPE_PADDING, last.y - uy * SWIPE_PADDING]
    const B = [x + ux * SWIPE_PADDING, y + uy * SWIPE_PADDING]

    const { newQuads, newFlashes } = ProcessSwipeSlice({
      quads,
      A,
      B,
      now
    })

    setQuads(newQuads)

    // append any new flashes
    if (newFlashes.length > 0) {
      setFlashes(fs => [...fs, ...newFlashes])
    }

    lastPtRef.current = { x, y }
  }

  const onHandlerStateChange = ({ nativeEvent }) => {
    if (
      nativeEvent.state === State.END ||
      nativeEvent.state === State.CANCELLED
    ) {
      lastPtRef.current = null;
      setSlicePoints([]);
    }
    if (nativeEvent.state === State.BEGAN) {
      lastPtRef.current = { x: nativeEvent.x, y: nativeEvent.y };
    }
  };


  return (
    <ImageBackground
      source={require('./assets/wood.jpg')}
      style={styles.flex}
      resizeMode="cover"
    >
      <GestureHandlerRootView style={styles.flex}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <View style={styles.flex}>
            <Svg width={width} height={height} style={styles.flex}>
              {RenderQuads(quads)}
              {RenderFlashes(flashes, setFlashes)}
            </Svg>

            <Svg style={StyleSheet.absoluteFill}>
              {slicePoints.length > 1 && (
                <Line
                  x1={slicePoints[slicePoints.length - 2].x}
                  y1={slicePoints[slicePoints.length - 2].y}
                  x2={slicePoints[slicePoints.length - 1].x}
                  y2={slicePoints[slicePoints.length - 1].y}
                  stroke="red"
                  strokeWidth={5}
                />
              )}
            </Svg>
          </View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </ImageBackground>
  );

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  flex: { flex: 1 },       
});