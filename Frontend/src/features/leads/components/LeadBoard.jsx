import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import EditLeadModal from '@features/leads/modals/EditLeadModal'
import { handleCardDrop } from '@features/leads/utils/leadBoardUtils'

function LeadBoard({ columns }) {
  const [showEdit, setShowEdit] = useState(false)
  const [currentLead, setCurrentLead] = useState(null)

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }
    const leadId = draggableId
    const newStatus = destination.droppableId
    await handleCardDrop(leadId, newStatus)
  }

  const openEdit = (lead) => {
    setCurrentLead(lead)
    setShowEdit(true)
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(columns).map(([status, leads]) => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="rounded-xl border bg-white p-3"
                >
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">{status}</h2>

                  <div className="space-y-3">
                    {leads.map((lead, idx) => (
                      <Draggable key={String(lead.id)} draggableId={String(lead.id)} index={idx}>
                        {(draggableProvided) => (
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            {...draggableProvided.dragHandleProps}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-medium text-gray-900">{lead.name || 'Unnamed Lead'}</div>
                                <div className="text-xs text-gray-600">{lead.mobile_number || 'N/A'}</div>
                                {lead.course && <div className="mt-1 text-xs text-gray-500">{lead.course}</div>}
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEdit(lead)
                                }}
                                className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <EditLeadModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        lead={currentLead}
        comments={currentLead?.comments || []}
      />
    </>
  )
}

export default LeadBoard
