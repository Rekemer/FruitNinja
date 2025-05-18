import {
    G,
    Polygon,
    Defs,
    ClipPath,
    Image as SvgImage
} from 'react-native-svg';
import { useEffect } from 'react';


import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedProps,
    runOnJS
} from 'react-native-reanimated'

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle)
import { Circle as SvgCircle } from 'react-native-svg'

export function RenderQuads(quads) {
    return quads.map(f => {
        const xs = f.pts.map(p => p.x);
        const ys = f.pts.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        // convert from global to local, where local center is bottom left corner
        const localPts = f.pts
            .map(p => ({ x: p.x - minX, y: p.y - minY }))
            .map(p => `${p.x},${p.y}`)
            .join(' ');
        return (
            <G key={f.id} transform={`translate(${minX},${minY})`}>
                <Defs>
                    <ClipPath id={`cp-${f.id}`}>
                        <Polygon points={localPts} />
                    </ClipPath>
                </Defs>
                <SvgImage
                    href={f.imageUri}
                    x={f.imageBox.x - minX}
                    y={f.imageBox.y - minY}
                    width={f.imageBox.w}
                    height={f.imageBox.h}
                    preserveAspectRatio="xMidYMid meet"
                    clipPath={`url(#cp-${f.id})`}
                />
            </G>
        );
    });
}

function RadialFlash({ x, y, maxR, onDone }) {
    const progress = useSharedValue(0)

    useEffect(() => {
        // grow to full size in 200ms, then call onDone
        progress.value = withTiming(1, { duration: 200 }, () => {
            runOnJS(onDone)()
        })
    }, [])

    const animatedProps = useAnimatedProps(() => ({
        r: progress.value * maxR,
        opacity: 1 - progress.value,
    }))

    return (
        <AnimatedCircle
            cx={x}
            cy={y}
            fill="rgba(255,255,255,0.3)"
            animatedProps={animatedProps}
        />
    )
}


export function RenderFlashes(flashes, setFlashes) {
    return flashes.map(f => (
        <RadialFlash
            key={f.id}
            x={f.x}
            y={f.y}
            maxR={80}
            onDone={() =>
                setFlashes(fs => fs.filter(x => x.id !== f.id))
            }
        />
    ));
}