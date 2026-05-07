import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { profileService } from '@/services/profile.service'
import type { Profile } from '@/types/domain'
import { toast } from 'sonner'

type AssignmentRow = { user_id: string; project?: { id: string; name: string } | null }

export const TeamPage = () => {
  const [members, setMembers] = useState<Profile[]>([])
  const [assignments, setAssignments] = useState<Record<string, { id: string; name: string }[]>>({})

  useEffect(() => {
    const loadMembers = async () => {
      const [{ data: memberData, error: membersError }, { data: assignmentData, error: assignmentError }] = await Promise.all([
        profileService.list(),
        profileService.projectAssignments(),
      ])
      if (membersError) toast.error(membersError.message)
      if (assignmentError) toast.error(assignmentError.message)

      const groupedAssignments = ((assignmentData ?? []) as unknown as AssignmentRow[]).reduce<Record<string, { id: string; name: string }[]>>((acc, row) => {
        const project = row.project
        if (!project) return acc
        if (!acc[row.user_id]) acc[row.user_id] = []
        if (!acc[row.user_id].some((item) => item.id === project.id)) {
          acc[row.user_id].push(project)
        }
        return acc
      }, {})

      setAssignments(groupedAssignments)
      setMembers((memberData ?? []) as Profile[])
    }
    void loadMembers()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-2xl font-semibold text-transparent">Team Management</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {members.map((member) => (
          <Card key={member.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{member.full_name}</p>
                <p className="text-sm text-slate-500">{member.email}</p>
              </div>
              <Badge tone={member.role === 'admin' ? 'active' : 'planned'}>{member.role}</Badge>
            </div>
            <div className="mt-3 border-t border-slate-200 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned projects</p>
              <div className="flex flex-wrap gap-1">
                {(assignments[member.id] ?? []).length > 0 ? (
                  assignments[member.id].map((project) => (
                    <Badge key={project.id} tone="in_progress">
                      {project.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">No projects assigned</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
