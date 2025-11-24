import React, { useEffect, useRef } from "react"

const IconWrapper = ({ children, strokeWidth = 1.5, size = 14, className = "", style = {}, ...props }) => {
	const containerRef = useRef(null)

	useEffect(() => {
		if (containerRef.current) {
			const svgs = containerRef.current.querySelectorAll("svg")
			svgs.forEach((svg) => {
				svg.style.strokeWidth = strokeWidth

				const elementsWithStroke = svg.querySelectorAll("*")
				elementsWithStroke.forEach((element) => {
					if (element.getAttribute("stroke") !== "none" && element.getAttribute("stroke") !== null) {
						element.style.strokeWidth = strokeWidth
					}
				})
			})
		}
	}, [strokeWidth])

	const wrapperStyle = {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		width: size,
		height: size,
		...style,
	}

	return (
		<span ref={containerRef} className={`icon-wrapper ${className}`} style={wrapperStyle} {...props}>
			{React.cloneElement(children, {
				style: {
					width: "100%",
					height: "100%",
					...children.props.style,
				},
			})}
		</span>
	)
}

export default IconWrapper
