import { Tooltip } from './Tooltip';
import type { SavedSession } from '../types';

interface SessionSidebarProps {
  sessions: SavedSession[];
  currentSessionId: string | null;
  userPlan: 'free' | 'starter' | 'pro';
  onLoad: (session: SavedSession) => void;
  onDelete: (id: string) => void;
  onSave: (id: string) => void;
}

const SAVE_LIMITS: Record<string, number> = {
  free: 0,
  starter: 5,
  pro: 20,
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function SessionSidebar({
  sessions,
  currentSessionId,
  userPlan,
  onLoad,
  onDelete,
  onSave,
}: SessionSidebarProps) {
  const recentSessions = sessions.filter(s => !s.isSaved);
  const savedSessions = sessions.filter(s => s.isSaved);
  const saveLimit = SAVE_LIMITS[userPlan] ?? 0;
  const canSave = userPlan !== 'free' && savedSessions.length < saveLimit;

  return (
    <aside className="session-sidebar">
      {/* Recent Sessions */}
      <div className="session-sidebar__group">
        <h3 className="session-sidebar__title">Recent Sessions</h3>
        {recentSessions.length === 0 ? (
          <p className="session-sidebar__empty">No recent sessions yet. Run an analysis to see sessions here.</p>
        ) : (
          <ul className="session-sidebar__list">
            {recentSessions.map(session => (
              <li
                key={session.id}
                className={`session-card ${session.id === currentSessionId ? 'session-card--active' : ''}`}
                onClick={() => onLoad(session)}
              >
                <div className="session-card__header">
                  <span className="session-card__domain">{session.domain}</span>
                  <span className="session-card__time">{timeAgo(session.updatedAt)}</span>
                </div>
                <div className="session-card__patterns">
                  {session.sourcePattern || '/'} → {session.targetPattern || '/'}
                </div>
                <div className="session-card__actions" onClick={e => e.stopPropagation()}>
                  {userPlan === 'free' ? (
                    <Tooltip content="Save sessions require a Starter or Pro subscription." position="left">
                      <button className="session-card__btn session-card__btn--save" disabled>
                        &#9734;
                      </button>
                    </Tooltip>
                  ) : canSave ? (
                    <Tooltip content="Save this session permanently." position="left">
                      <button
                        className="session-card__btn session-card__btn--save"
                        onClick={() => onSave(session.id)}
                      >
                        &#9734;
                      </button>
                    </Tooltip>
                  ) : (
                    <Tooltip content={`You've reached your ${saveLimit} saved session limit.`} position="left">
                      <button className="session-card__btn session-card__btn--save" disabled>
                        &#9734;
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip content="Delete this session." position="left">
                    <button
                      className="session-card__btn session-card__btn--delete"
                      onClick={() => {
                        if (confirm('Delete this session?')) onDelete(session.id);
                      }}
                    >
                      &times;
                    </button>
                  </Tooltip>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Saved Sessions */}
      <div className="session-sidebar__group">
        <h3 className="session-sidebar__title">
          Saved Sessions
          {userPlan !== 'free' && (
            <span className="session-sidebar__count">{savedSessions.length}/{saveLimit}</span>
          )}
        </h3>
        {savedSessions.length === 0 ? (
          <p className="session-sidebar__empty">
            {userPlan === 'free'
              ? 'Upgrade to Starter or Pro to save sessions permanently.'
              : 'No saved sessions yet. Click the star on a recent session to save it.'}
          </p>
        ) : (
          <ul className="session-sidebar__list">
            {savedSessions.map(session => (
              <li
                key={session.id}
                className={`session-card session-card--saved ${session.id === currentSessionId ? 'session-card--active' : ''}`}
                onClick={() => onLoad(session)}
              >
                <div className="session-card__header">
                  <span className="session-card__domain">
                    <span className="session-card__star">&#9733;</span>
                    {session.domain}
                  </span>
                  <span className="session-card__time">{timeAgo(session.updatedAt)}</span>
                </div>
                <div className="session-card__patterns">
                  {session.sourcePattern || '/'} → {session.targetPattern || '/'}
                </div>
                <div className="session-card__actions" onClick={e => e.stopPropagation()}>
                  <Tooltip content="Delete this saved session." position="left">
                    <button
                      className="session-card__btn session-card__btn--delete"
                      onClick={() => {
                        if (confirm('Delete this saved session?')) onDelete(session.id);
                      }}
                    >
                      &times;
                    </button>
                  </Tooltip>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
