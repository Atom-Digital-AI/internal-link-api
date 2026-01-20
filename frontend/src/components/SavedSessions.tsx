import type { SavedSessionsListProps } from '../types';
import { Tooltip } from './Tooltip';

export function SavedSessions({ sessions, onLoad, onDelete, onClose }: SavedSessionsListProps) {
  if (sessions.length === 0) {
    return (
      <div className="saved-sessions-modal">
        <div className="saved-sessions-content">
          <div className="saved-sessions-header">
            <h2>Saved Sessions</h2>
            <button onClick={onClose} className="close-btn">&times;</button>
          </div>
          <p className="no-sessions">No saved sessions yet. Run an analysis and save it to access it later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-sessions-modal">
      <div className="saved-sessions-content">
        <div className="saved-sessions-header">
          <h2>Saved Sessions</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <ul className="sessions-list">
          {sessions.map(session => (
            <li key={session.id} className="session-item">
              <div className="session-info">
                <div className="session-name">{session.name}</div>
                <div className="session-meta">
                  <span className="session-domain">{session.domain}</span>
                  <span className="session-date">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="session-stats">
                  <span>{session.summary.total_scanned} pages</span>
                  <span className="needs">{session.summary.needs_links} need links</span>
                  <span className="good">{session.summary.has_good_density} good</span>
                </div>
              </div>
              <div className="session-actions">
                <Tooltip content="Restore this saved session with all its analysis results." position="left">
                  <button onClick={() => onLoad(session)} className="primary small">
                    Load
                  </button>
                </Tooltip>
                <Tooltip content="Permanently remove this saved session. This cannot be undone." position="left">
                  <button
                    onClick={() => {
                      if (confirm('Delete this saved session?')) {
                        onDelete(session.id);
                      }
                    }}
                    className="small danger"
                  >
                    Delete
                  </button>
                </Tooltip>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
