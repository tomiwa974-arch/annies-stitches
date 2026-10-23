import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, router, usePage } from '@inertiajs/react'
import { UserRound, Bell, Settings, LogOut, X } from 'lucide-react'

interface AccountUser {
  fullName?: string
  name?: string
  email?: string
  createdAt?: string
}

type Panel = 'My Profile' | 'Notifications' | 'Settings'

export default function ProfileMenu() {
  const { props, url } = usePage()
  const user = (props.auth as { user?: AccountUser } | undefined)?.user
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<Panel | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    setOpen(false)
    setPanel(null)
  }, [url, user?.email])

  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLButtonElement>('.profile-menu-action')?.focus()
    function outside(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !panel || !user) return
    dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [panel, user])

  function showPanel(next: Panel) {
    setOpen(false)
    setPanel(next)
  }
  function closePanel() {
    setPanel(null)
    buttonRef.current?.focus()
  }
  function toggle() {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', url)
      router.visit('/login')
      return
    }
    setOpen((value) => !value)
  }

  return (
    <>
      <div className="profile-menu-position" ref={menuRef}>
        <button
          ref={buttonRef}
          type="button"
          className="public-navigation-pill profile-trigger"
          onClick={toggle}
          aria-label={user ? 'Open profile menu' : 'Sign in to your profile'}
          aria-expanded={open}
          aria-controls={open ? 'shared-profile-menu' : undefined}
          title="Profile"
        >
          <UserRound size={18} aria-hidden="true" />
        </button>
        {open && user && (
          <div id="shared-profile-menu" className="profile-dropdown" aria-label="Your account">
            <div className="profile-menu-identity">
              <strong>{user.fullName || user.name || 'Your account'}</strong>
              <span>{user.email}</span>
            </div>
            <button
              type="button"
              className="profile-menu-action"
              onClick={() => showPanel('My Profile')}
            >
              <UserRound size={17} /> My Profile
            </button>
            <button
              type="button"
              className="profile-menu-action"
              onClick={() => showPanel('Notifications')}
            >
              <Bell size={17} /> Notifications
            </button>
            <button
              type="button"
              className="profile-menu-action"
              onClick={() => showPanel('Settings')}
            >
              <Settings size={17} /> Settings
            </button>
            <Link
              href="/logout"
              method="post"
              as="button"
              className="profile-menu-action profile-signout"
              onClick={() => setOpen(false)}
            >
              <LogOut size={17} /> Sign Out
            </Link>
          </div>
        )}
      </div>
      {panel &&
        user &&
        typeof document !== 'undefined' &&
        createPortal(
          <dialog
            ref={dialogRef}
            className="profile-dialog"
            aria-labelledby="profile-dialog-title"
            onCancel={closePanel}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                const bounds = event.currentTarget.getBoundingClientRect()
                if (
                  event.clientX < bounds.left ||
                  event.clientX > bounds.right ||
                  event.clientY < bounds.top ||
                  event.clientY > bounds.bottom
                )
                  closePanel()
              }
            }}
          >
            <div className="profile-dialog-header">
              <h2 id="profile-dialog-title">{panel}</h2>
              <button
                type="button"
                className="profile-dialog-close"
                aria-label="Close profile panel"
                onClick={closePanel}
                autoFocus
              >
                <X size={20} />
              </button>
            </div>
            <div className="profile-dialog-content">
              {panel === 'My Profile' && (
                <>
                  <div className="profile-avatar">
                    <UserRound size={35} />
                  </div>
                  <h3>{user.fullName || user.name || 'Your account'}</h3>
                  <p>{user.email}</p>
                  {user.createdAt && <p>Member since {new Date(user.createdAt).getFullYear()}</p>}
                  <dl>
                    <dt>Full name</dt>
                    <dd>{user.fullName || user.name || 'Not set'}</dd>
                    <dt>Email address</dt>
                    <dd>{user.email || 'Not set'}</dd>
                  </dl>
                  <button
                    type="button"
                    className="profile-panel-button"
                    onClick={() => setPanel('Settings')}
                  >
                    Account settings
                  </button>
                </>
              )}
              {panel === 'Notifications' && (
                <>
                  <Bell size={32} />
                  <h3>No notifications yet</h3>
                  <p>For your orders and delivery progress, open tracking in the store.</p>
                  <Link href="/store" className="profile-panel-button" onClick={closePanel}>
                    Go to store
                  </Link>
                </>
              )}
              {panel === 'Settings' && (
                <>
                  <h3>Account</h3>
                  <dl>
                    <dt>Email address</dt>
                    <dd>{user.email || 'Not set'}</dd>
                  </dl>
                  <Link
                    href="/forgot-password"
                    className="profile-panel-button"
                    onClick={closePanel}
                  >
                    Change password
                  </Link>
                  <p className="profile-settings-note">
                    Use the password reset flow to update your password.
                  </p>
                </>
              )}
            </div>
          </dialog>,
          document.body
        )}
    </>
  )
}
