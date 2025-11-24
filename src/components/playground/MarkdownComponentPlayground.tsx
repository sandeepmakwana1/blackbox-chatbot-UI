import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export const StyledMarkdown = ({ children, className = "", ...props }) => {
	return (
		<div className={className}>
			<ReactMarkdown
				children={children}
				remarkPlugins={[remarkGfm]}
				components={{
					// Headings
					h1: ({ children }) => (
						<h1 className="text-xs font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
							{children}
						</h1>
					),
					h2: ({ children }) => <h2 className="text-xs font-semibold text-gray-800 mb-3">{children}</h2>,
					h3: ({ children }) => <h3 className="text-xs font-semibold text-gray-700 mb-1 mt-2">{children}</h3>,
					h4: ({ children }) => <h4 className="text-xs font-semibold text-gray-700 mb-1 mt-2">{children}</h4>,
					h5: ({ children }) => <h5 className="text-xs font-medium text-gray-600 mb-1 mt-2">{children}</h5>,
					h6: ({ children }) => (
						<h6 className="text-xs font-medium text-gray-600 mb-1 mt-2 uppercase tracking-wide">
							{children}
						</h6>
					),

					// Text elements
					p: ({ children }) => <p className="text-gray-600 text-xs leading-relaxed mb-2">{children}</p>,

					// Lists
					ul: ({ children }) => (
						<ul className="list-disc pl-6 text-xs text-gray-600 mb-2 space-y-1">{children}</ul>
					),
					ol: ({ children }) => (
						<ol className="list-decimal pl-6 text-xs text-gray-600 mb-2 space-y-1">{children}</ol>
					),
					li: ({ children }) => <li className="text-gray-600 text-xs leading-relaxed">{children}</li>,

					// Links
					a: ({ href, children }) => (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:text-blue-800 underline text-xs transition-colors break-words"
						>
							{children}
						</a>
					),

					// Code
					code: ({ children, className }) => {
						const isInline = !className
						if (isInline) {
							return (
								<code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono break-words">
									{children}
								</code>
							)
						}
						return (
							<code className="block bg-gray-50 text-gray-800 p-3 rounded-md text-xs font-mono overflow-x-auto border break-words">
								{children}
							</code>
						)
					},
					pre: ({ children }) => (
						<pre className="bg-gray-50 text-gray-800 p-3 rounded-md text-xs font-mono overflow-x-auto border mb-2 max-w-full">
							{children}
						</pre>
					),

					// Quotes
					blockquote: ({ children }) => (
						<blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 text-sm mb-2 bg-gray-50 py-2 break-words">
							{children}
						</blockquote>
					),

					// Tables - Fixed to prevent overflow
					table: ({ children }) => (
						<div className="overflow-x-auto mb-4 max-w-full border border-gray-200 rounded-md">
							<table className="w-full text-sm table-auto">{children}</table>
						</div>
					),
					thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
					tbody: ({ children }) => <tbody className="divide-y divide-gray-200">{children}</tbody>,
					tr: ({ children }) => <tr className="hover:bg-gray-50">{children}</tr>,
					th: ({ children }) => (
						<th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-0 break-words">
							<div className="truncate" title={typeof children === "string" ? children : ""}>
								{children}
							</div>
						</th>
					),
					td: ({ children }) => (
						<td className="px-2 py-2 text-xs text-gray-600 border-b border-gray-100 min-w-0 break-words">
							<div className="break-words max-w-xs">{children}</div>
						</td>
					),

					// Horizontal rule
					hr: () => <hr className="border-gray-200 my-6" />,

					// Images
					img: ({ src, alt }) => (
						<img src={src} alt={alt} className="max-w-full h-auto rounded-md mb-4 border border-gray-200" />
					),

					// Strong and emphasis
					strong: ({ children }) => (
						<strong className="font-semibold text-gray-800 break-words">{children}</strong>
					),
					em: ({ children }) => <em className="italic text-gray-700 break-words">{children}</em>,

					// Strikethrough
					del: ({ children }) => <del className="line-through text-gray-500 break-words">{children}</del>,
				}}
				{...props}
			/>
		</div>
	)
}
