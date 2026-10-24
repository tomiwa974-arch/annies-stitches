const database = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('annies-fitting', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('drafts')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
export async function fittingDraft<T>(
  mode: 'read' | 'save' | 'clear',
  value?: T
): Promise<T | undefined> {
  const db = await database()
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction('drafts', mode === 'read' ? 'readonly' : 'readwrite')
      const store = tx.objectStore('drafts')
      const request =
        mode === 'read'
          ? store.get('current')
          : mode === 'save'
            ? store.put(value, 'current')
            : store.delete('current')
      tx.oncomplete = () => resolve(request.result as T | undefined)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}
