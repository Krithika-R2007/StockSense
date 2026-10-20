import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Input } from '../components/ui/Input'
import { users } from '../data/mock'

type Tab = 'users' | 'roles' | 'audit' | 'settings'

const tabs: { id: Tab; label: string }[] = [
  { id: 'users', label: 'Users' },
  { id: 'roles', label: 'Roles' },
  { id: 'audit', label: 'Audit Logs' },
  { id: 'settings', label: 'Settings' },
]

const roles = ['Admin', 'Warehouse Manager', 'Procurement Officer', 'Auditor']

const permissions = ['View inventory', 'Edit inventory', 'Approve transfers', 'Manage users']

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('users')

  return (
    <div>
      <PageHeader title="Admin Panel" />

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">User Management</h2>
            <Button>Invite User</Button>
          </div>
          <Card className="mb-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                placeholder="Search users"
                className="h-10 flex-1 rounded-[8px] border border-border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <select className="h-10 rounded-[8px] border border-border px-3 text-sm sm:w-48">
                <option>All roles</option>
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </Card>
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border bg-app/80 text-xs text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Last Login</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.email} className="border-b border-border/70">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-muted">{u.email}</td>
                      <td className="px-4 py-3">{u.role}</td>
                      <td className="px-4 py-3">
                        <Chip
                          label={u.status}
                          tone={u.status === 'Active' ? 'good' : 'info'}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted">{u.lastLogin}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Button variant="ghost" className="h-8 px-2 text-xs">
                            Edit
                          </Button>
                          <Button variant="ghost" className="h-8 px-2 text-xs">
                            Deactivate
                          </Button>
                          <Button variant="ghost" className="h-8 px-2 text-xs">
                            Reset Password
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === 'roles' && (
        <>
          <div className="mb-4 flex justify-end">
            <Button>Create Role</Button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th className="pb-3 pr-4 font-medium">Permission</th>
                    {roles.map((r) => (
                      <th key={r} className="pb-3 px-2 text-center font-medium">
                        {r.split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((p) => (
                    <tr key={p} className="border-b border-border/60">
                      <td className="py-3 pr-4">{p}</td>
                      {roles.map((r) => (
                        <td key={r} className="py-3 text-center">
                          <input type="checkbox" defaultChecked={r === 'Admin'} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === 'audit' && (
        <>
          <div className="mb-4 flex flex-wrap justify-end gap-2">
            <Button variant="secondary">Export Logs</Button>
            <Button>Verify Chain</Button>
          </div>
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-border bg-app/80 text-xs text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Entity</th>
                    <th className="px-4 py-3 font-medium">IP</th>
                    <th className="px-4 py-3 font-medium">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/70">
                    <td className="px-4 py-3 text-muted">2026-09-30 09:01</td>
                    <td className="px-4 py-3">maria.chen@example.com</td>
                    <td className="px-4 py-3">UPDATE</td>
                    <td className="px-4 py-3">SKU-1042</td>
                    <td className="px-4 py-3 text-muted">10.0.4.22</td>
                    <td className="px-4 py-3 font-mono text-xs">a3f9…c21</td>
                  </tr>
                  <tr className="border-b border-border/70">
                    <td className="px-4 py-3 text-muted">2026-09-30 08:44</td>
                    <td className="px-4 py-3">james.okon@example.com</td>
                    <td className="px-4 py-3">APPROVE</td>
                    <td className="px-4 py-3">TR-2398</td>
                    <td className="px-4 py-3 text-muted">10.0.4.18</td>
                    <td className="px-4 py-3 font-mono text-xs">b8e2…9fd</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === 'settings' && (
        <Card className="max-w-xl text-left">
          <form className="space-y-4">
            <Input label="Organization name" defaultValue="Smart Inventory Co." />
            <Input label="Default warehouse" defaultValue="Warehouse A" />
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Low stock alert threshold (%)</span>
              <input
                type="number"
                defaultValue={20}
                className="h-10 rounded-[8px] border border-border px-3 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked />
              Enable email notifications for expiring batches
            </label>
            <Button type="submit" className="mt-4">
              Save Changes
            </Button>
          </form>
        </Card>
      )}
    </div>
  )
}
