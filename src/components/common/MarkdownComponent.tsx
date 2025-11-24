import React, { useEffect, useRef, useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

const MermaidDiagram: React.FC<{
	chart: string
	id?: string
	sectionId?: string
	index?: number
}> = ({ chart, id, sectionId, index }) => {
	const ref = useRef<HTMLDivElement>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isRendered, setIsRendered] = useState(false)

	const diagramId = id || `mermaid-${sectionId || "section"}-${index || 0}-${Math.random().toString(36).substr(2, 5)}`

	const renderDiagram = useCallback(async () => {
		if (!ref.current || isRendered) return

		setIsLoading(true)
		setError(null)

		try {
			const mermaid = (await import("mermaid")).default

			mermaid.initialize({
				startOnLoad: false,
				theme: "default",
				securityLevel: "loose",
				flowchart: {
					useMaxWidth: true,
					htmlLabels: true,
				},
				deterministicIds: true,
				deterministicIDSeed: diagramId,
			})

			const cleanChart = chart.trim()
			const { svg } = await mermaid.render(diagramId, cleanChart)

			if (ref.current) {
				ref.current.innerHTML = svg
				setIsLoading(false)
				setIsRendered(true)

				const event = new CustomEvent("mermaidRendered", {
					detail: { diagramId, sectionId, index },
				})
				window.dispatchEvent(event)
			}
		} catch (error) {
			console.error(`Mermaid rendering failed for ${diagramId}:`, error)
			setError(error instanceof Error ? error.message : "Failed to render diagram")
			setIsLoading(false)

			if (ref.current) {
				ref.current.innerHTML = `
          <div class="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
            <strong>Diagram Error (${diagramId}):</strong> ${
					error instanceof Error ? error.message : "Failed to render"
				}
            <details class="mt-2">
              <summary class="cursor-pointer">Show diagram code</summary>
              <pre class="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">${chart}</pre>
            </details>
          </div>
        `
			}
		}
	}, [chart, diagramId, sectionId, index, isRendered])

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			renderDiagram()
		}, 100)

		return () => clearTimeout(timeoutId)
	}, [renderDiagram])

	if (isLoading) {
		return (
			<div className="my-6 flex justify-center">
				<div className="bg-gray-100 border border-gray-200 rounded p-4 text-gray-600 text-sm animate-pulse">
					Loading diagram ({diagramId})...
				</div>
			</div>
		)
	}

	return (
		<div
			ref={ref}
			className="my-6 flex justify-center overflow-x-auto"
			data-diagram-id={diagramId}
			data-section-id={sectionId}
		/>
	)
}

export const StyledMarkdown = ({
	children,
	className = "",
	sectionId = "default-section",
	...props
}: {
	children: any
	className?: string
	sectionId?: string
	[x: string]: any
}) => {
	const diagramCounter = useRef(0)

	return (
		<div className={className}>
			<ReactMarkdown
				children={children}
				remarkPlugins={[remarkGfm, remarkBreaks]}
				rehypePlugins={[rehypeRaw]}
				components={{
					code: ({ node, className, children, ...props }) => {
						const match = /language-(\w+)/.exec(className || "")
						const language = match ? match[1] : ""
						const code = String(children).replace(/\n$/, "")

						if (language === "mermaid") {
							const index = diagramCounter.current++
							return <MermaidDiagram chart={code} sectionId={sectionId} index={index} />
						}

						const isCodeBlock =
							(className && className.startsWith("language-")) || String(children).includes("\n")

						if (isCodeBlock) {
							return (
								<pre className="bg-neutral-900 text-neutral-400 p-4 rounded-lg text-xs font-mono whitespace-pre-wrap mb-6 border">
									{" "}
									<code className={className} {...props}>
										{children}
									</code>
								</pre>
							)
						}

						return (
							<code
								className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-mono border border-red-200"
								{...props}
							>
								{children}
							</code>
						)
					},

					h1: ({ children }) => (
						<h1 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
							{children}
						</h1>
					),
					h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-6">{children}</h2>,
					h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-5">{children}</h3>,
					h4: ({ children }) => (
						<h4 className="text-base font-semibold text-gray-800 mb-2 mt-4">{children}</h4>
					),
					h5: ({ children }) => <h5 className="text-sm font-medium text-gray-700 mb-2 mt-3">{children}</h5>,
					h6: ({ children }) => (
						<h6 className="text-xs font-medium text-gray-600 mb-2 mt-3 uppercase tracking-wide">
							{children}
						</h6>
					),

					p: ({ children }) => <p className="text-gray-700 text-sm leading-relaxed mb-4">{children}</p>,
					strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
					em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
					del: ({ children }) => <del className="line-through text-gray-500">{children}</del>,

					ul: ({ children }) => (
						<ul className="list-disc pl-6 text-sm text-gray-700 mb-4 space-y-2">{children}</ul>
					),
					ol: ({ children }) => (
						<ol className="list-decimal pl-6 text-sm text-gray-700 mb-4 space-y-2">{children}</ol>
					),
					li: ({ children }) => <li className="text-gray-700 text-sm leading-relaxed">{children}</li>,

					a: ({ href, children }) => (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:text-blue-800 underline text-sm transition-colors duration-150"
						>
							{children}
						</a>
					),

					blockquote: ({ children }) => (
						<blockquote className="border-l-4 border-blue-500 pl-6 py-2 italic text-gray-700 text-sm mb-4 bg-blue-50 rounded-r-lg shadow-sm">
							{children}
						</blockquote>
					),

					table: ({ children }) => (
						<div className="overflow-x-auto mb-6 rounded-lg border shadow-sm">
							<table className="min-w-full border-gray-200 text-sm">{children}</table>
						</div>
					),
					thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
					tbody: ({ children }) => <tbody className="divide-y divide-gray-200 bg-white">{children}</tbody>,
					tr: ({ children }) => <tr className="hover:bg-gray-50 transition-colors">{children}</tr>,
					th: ({ children }) => (
						<th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider border-b border-gray-300">
							{children}
						</th>
					),
					td: ({ children }) => (
						<td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">{children}</td>
					),

					hr: () => <hr className="border-gray-300 my-8 border-t-2" />,

					img: ({ src, alt }) => (
						<img
							src={src}
							alt={alt}
							className="max-w-full h-auto rounded-lg mb-6 border border-gray-200 shadow-sm"
						/>
					),
				}}
				{...props}
			/>
		</div>
	)
}
