export function SegmentIntersectionPoint(x1, y1, x2, y2, x3, y3, x4, y4) {
    // Line AB represented parametrically: A + t*(B−A)
    const dx1 = x2 - x1, dy1 = y2 - y1;
    const dx2 = x4 - x3, dy2 = y4 - y3;
    const denom = dx1 * dy2 - dy1 * dx2;
    if (denom === 0) return null;              // parallel or collinear
    const t = ((x3 - x1) * dy2 - (y3 - y1) * dx2) / denom;
    const u = ((x3 - x1) * dy1 - (y3 - y1) * dx1) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return { x: x1 + t * dx1, y: y1 + t * dy1 };
    }
    return null;
}

export function LineHitsSegment(ax, ay, bx, by, cx, cy, dx, dy) {
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
