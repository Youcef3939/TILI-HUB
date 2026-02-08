import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import MeetingsCalendar from './MeetingsCalendar';
import MeetingDetail from './MeetingDetail';
import MeetingCreateForm from './MeetingCreateForm';
import EnhancedMeetingResponse from './MeetingResponse'; // Using the enhanced component
import { PermissionGuard } from '/src/contexts/PermissionGuard.jsx';
import { RESOURCES, ACTIONS } from '/src/contexts/PermissionsContext.jsx';

const MeetingRoutes = () => {
    return (
        <Routes>
            {/* View calendar - All users can view */}
            <Route path="/" element={<MeetingsCalendar />} />

            {/* Create meeting - Only users with create permission */}
            <Route
                path="/create"
                element={
                    <PermissionGuard
                        resource={RESOURCES.MEETINGS}
                        action={ACTIONS.CREATE}
                        redirectTo="/meetings"
                    >
                        <MeetingCreateForm isEditMode={false} />
                    </PermissionGuard>
                }
            />

            {/* Edit meeting - Only users with edit permission */}
            <Route
                path="/edit/:id"
                element={
                    <PermissionGuard
                        resource={RESOURCES.MEETINGS}
                        action={ACTIONS.EDIT}
                        redirectTo="/meetings"
                    >
                        <MeetingCreateForm isEditMode={true} />
                    </PermissionGuard>
                }
            />

            {/* Response routes - IMPORTANT: Keep these routes matching the backend paths */}
            <Route path="/response/:attendeeId/:token" element={<EnhancedMeetingResponse />} />
            <Route path="/response/:attendeeId/:token/:responseType" element={<EnhancedMeetingResponse />} />

            {/* View meeting details - All users can view */}
            <Route path="/:id" element={<MeetingDetail />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/meetings" replace />} />
        </Routes>
    );
};

export default MeetingRoutes;