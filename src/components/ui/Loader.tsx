interface LoaderProps {
  message?: string
  progress?: number
}

export default function Loader({ message = 'loading...', progress }: LoaderProps) {
  return (
    <div className="loader-wrapper">
      <div className="loader-spinner" />
      <p className="loader-message">{message}</p>
      {progress !== undefined && (
        <div className="loader-bar-track">
          <div className="loader-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}