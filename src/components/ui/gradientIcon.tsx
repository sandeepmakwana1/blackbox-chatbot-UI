import React, { useMemo } from "react"

type AnyIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>

interface Stop {
	offset: string
	color: string
}

interface GradientIconProps {
	Icon: AnyIcon
	size?: number
	angle?: number
	mode?: "stroke" | "fill" | "both"
	stops: Stop[]
	strokeWidth?: number
	iconProps?: any
}

function angleToCoordsInViewBox(angle: number, w = 24, h = 24) {
	const rad = ((angle % 360) * Math.PI) / 180
	const cx = w / 2,
		cy = h / 2
	const dx = (Math.cos(rad) * w) / 2
	const dy = (Math.sin(rad) * h) / 2
	return { x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy }
}

export function GradientIcon({
	Icon,
	size = 64,
	angle = 90,
	mode = "stroke",
	stops,
	strokeWidth,
	iconProps = {},
}: GradientIconProps) {
	const gradId = useMemo(() => `grad-${Math.random().toString(36).slice(2, 9)}`, [])
	const scope = useMemo(() => `scope-${Math.random().toString(36).slice(2, 9)}`, [])

	const viewBoxStr = (iconProps.viewBox as string) || "0 0 24 24"
	const [, , vbWStr, vbHStr] = viewBoxStr.split(/\s+/)
	const vbW = Number(vbWStr) || 24
	const vbH = Number(vbHStr) || 24

	const { x1, y1, x2, y2 } = angleToCoordsInViewBox(angle, vbW, vbH)

	const strokeRule = mode !== "fill" ? `stroke: url(#${gradId}) !important;` : ""
	const fillRule = mode !== "stroke" ? `fill: url(#${gradId}) !important;` : ""
	const strokeWidthRule =
		strokeWidth !== undefined && mode !== "fill" ? `stroke-width: ${strokeWidth} !important;` : ""

	return (
		<span className={scope} style={{ display: "inline-block", lineHeight: 0 }}>
			<style>{`.${scope} svg * { ${strokeRule} ${fillRule} ${strokeWidthRule} }`}</style>

			<svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
				<defs>
					<linearGradient id={gradId} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
						{stops.map((s, i) => (
							<stop key={i} offset={s.offset} stopColor={s.color} />
						))}
					</linearGradient>
				</defs>
			</svg>

			<Icon size={size as any} width={size} height={size} {...iconProps} />
		</span>
	)
}
