import DeliveryFields, { emptyDelivery, type DeliveryAddress } from './DeliveryFields'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, router, usePage } from '@inertiajs/react'
import { api, ApiError } from '../../lib/api'
import { mergeGuestShopping } from '../../lib/guest-shopping'
import type { FormEvent } from 'react'
import { UserRound, Bell, LogOut, X } from 'lucide-react'

interface AccountUser {
  id?: number
  role?: string
  fullName?: string
  name?: string
  email?: string
  createdAt?: string
}

type Panel = 'My Profile' | 'Notifications'

export default function ProfileMenu() {
  const { props, url } = usePage()
  const adminScope = url.split('?')[0].startsWith('/admin')
  const accountUrl = adminScope ? '/admin/account' : '/api/account'
  const sharedUser = (props.auth as { user?: AccountUser } | undefined)?.user
  const [account, setAccount] = useState<{
    user: AccountUser
    deliveryAddress: DeliveryAddress | null
    notifications: { id: string; title: string; body: string; date: string; href: string }[]
  } | null>(null)
  const user = account?.user || sharedUser
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [failure, setFailure] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [delivery, setDelivery] = useState<DeliveryAddress>(emptyDelivery)
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<Panel | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (sharedUser?.id && !adminScope) mergeGuestShopping(sharedUser.id).catch(() => {})
  }, [sharedUser?.id])

  useEffect(() => {
    if (!sharedUser?.id) return
    const heartbeat = () => {
      if (document.visibilityState === 'visible')
        api(accountUrl + '/presence', 'POST').catch(() => {})
    }
    heartbeat()
    const timer = window.setInterval(heartbeat, 60_000)
    document.addEventListener('visibilitychange', heartbeat)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', heartbeat)
    }
  }, [sharedUser?.id])

  useEffect(() => {
    setOpen(false)
    setPanel(null)
    setAccount(null)
  }, [url, sharedUser?.id])

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
  }, [panel, sharedUser?.id])

  function showPanel(next: Panel) {
    setOpen(false)
    setPanel(next)
    setNotice('')
    setFailure('')
    setFields({})
    setLoading(true)
    api<NonNullable<typeof account>>(accountUrl)
      .then((result) => {
        setAccount(result)
        setDelivery({
          ...emptyDelivery,
          recipient: result.user.fullName || '',
          ...result.deliveryAddress,
        })
      })
      .catch((error) => setFailure(error.message))
      .finally(() => setLoading(false))
  }
  async function saveDelivery(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setFailure('')
    setFields({})
    setNotice('')
    try {
      const result = await api<{ deliveryAddress: DeliveryAddress; message: string }>(
        accountUrl + '/delivery',
        'PUT',
        delivery
      )
      setDelivery({ ...emptyDelivery, ...result.deliveryAddress })
      setNotice(result.message)
    } catch (error) {
      if (error instanceof ApiError) {
        setFields(error.fields)
        setFailure(Object.keys(error.fields).length ? '' : error.message)
      } else setFailure('The account could not be updated.')
    } finally {
      setSaving(false)
    }
  }
  function closePanel() {
    setPanel(null)
    buttonRef.current?.focus()
  }
  function toggle() {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', url)
      router.visit(adminScope ? '/admin/login' : '/login')
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
            <Link
              href={adminScope ? '/admin/logout' : '/logout'}
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
              {loading && <p role="status">Loading your account...</p>}
              {failure && (
                <p className="profile-error" role="alert">
                  {failure}
                </p>
              )}
              {notice && (
                <p className="profile-notice" role="status">
                  {notice}
                </p>
              )}
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
                  {!loading && (
                    <form className="profile-settings-form" onSubmit={saveDelivery}>
                      <h3>Delivery details</h3>
                      <p>Saved for your next order. Update these details whenever you need.</p>
                      <DeliveryFields
                        value={delivery}
                        onChange={setDelivery}
                        errors={fields}
                        disabled={saving}
                      />
                      <button className="profile-panel-button" disabled={saving}>
                        {saving ? 'Saving...' : 'Save delivery details'}
                      </button>
                    </form>
                  )}
                </>
              )}
              {panel === 'Notifications' && !loading && (
                <div className="profile-updates">
                  {!account?.notifications.length && (
                    <>
                      <Bell size={30} />
                      <h3>No updates yet</h3>
                      <p>Your order and fitting updates will appear here.</p>
                    </>
                  )}
                  {account?.notifications.map((item) => (
                    <Link key={item.id} href={item.href} onClick={closePanel}>
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                      <small>{item.date ? new Date(item.date).toLocaleString() : ''}</small>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </dialog>,
          document.body
        )}
    </>
  )
}
