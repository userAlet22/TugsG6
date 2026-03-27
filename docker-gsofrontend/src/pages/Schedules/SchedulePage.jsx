import { useState, useReducer, useEffect, useCallback, memo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ALLOWED_ROLES = new Set([1, 2, 3, 5]);

// Custom Hooks
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
};

// Reducer
const sidebarReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case 'TOGGLE_MOBILE_MENU':
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case 'CLOSE_MOBILE_MENU':
      return { ...state, isMobileMenuOpen: false };
    default:
      return state;
  }
};

const getStoredUser = () => {
  const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

const normalizeTimeInput = (value) => {
  if (!value) return '';
  return value.length >= 5 ? value.slice(0, 5) : value;
};

const Header = memo(({ isMobileMenuOpen, onToggleMobileMenu, onCloseMobileMenu, menuItems, title }) => {
  const mobileMenuRef = useRef(null);

  useClickOutside(mobileMenuRef, () => {
    if (isMobileMenuOpen) onCloseMobileMenu();
  });

  return (
    <header className="bg-black text-white p-4 flex justify-between items-center relative">
      <span className="text-xl md:text-2xl font-extrabold tracking-tight">
        ManageIT
      </span>

      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
        </button>
        <div className="hidden md:block text-xl font-bold text-white ml-4">
          {title}
        </div>
      </div>

      <div
        ref={mobileMenuRef}
        className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="py-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.text}
              to={item.to}
              className="flex items-center px-4 py-3 text-sm hover:bg-gray-700 transition-colors"
              onClick={onCloseMobileMenu}
            >
              <Icon path={item.icon} className="w-5 h-5 mr-3" />
              {item.text}
            </NavLink>
          ))}
        </nav>
        <div className="text-center py-2 text-xs text-gray-400 border-t border-gray-700">
          Created By Bantilan & Friends
        </div>
      </div>
    </header>
  );
});

const CalendarHeader = memo(({ currentDate, prevMonth, nextMonth }) => {
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <div className="flex justify-between items-center mb-4 px-2">
      <button
        onClick={prevMonth}
        className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
      >
        <Icon path="M15 19l-7-7 7-7" className="w-5 h-5" />
      </button>
      <h3 className="text-xl font-bold text-gray-800">{monthName} {year}</h3>
      <button
        onClick={nextMonth}
        className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
      >
        <Icon path="M9 5l7 7-7 7" className="w-5 h-5" />
      </button>
    </div>
  );
});

const EventForm = memo(({ newEvent, setNewEvent, handleSaveEvent, closeForm, offices, isEditing, isOfficeLocked }) => (
  <div className="p-4 border-b border-gray-200 bg-gray-50">
    <div className="flex flex-wrap gap-2">
      <input
        type="text"
        placeholder="Event title"
        className="border p-2 rounded flex-grow text-sm"
        value={newEvent.title}
        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
      />
      <input
        type="date"
        className="border p-2 rounded text-sm"
        value={newEvent.date}
        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
      />
      <input
        type="time"
        className="border p-2 rounded text-sm"
        value={newEvent.time}
        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
      />
      <input
        type="text"
        placeholder="Location"
        className="border p-2 rounded flex-grow text-sm"
        value={newEvent.location}
        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
      />
      <select
        className="border p-2 rounded text-sm"
        value={newEvent.assigned_office_id}
        onChange={(e) => setNewEvent({ ...newEvent, assigned_office_id: e.target.value })}
        disabled={isOfficeLocked}
      >
        <option value="">Select Office</option>
        {offices.map((office) => (
          <option key={office.id} value={office.id}>
            {office.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Notes"
        className="border p-2 rounded flex-grow text-sm"
        value={newEvent.notes}
        onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
      />
      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
        <button
          onClick={handleSaveEvent}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm flex-grow sm:flex-grow-0"
        >
          {isEditing ? 'Update' : 'Save'}
        </button>
        <button
          onClick={closeForm}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm flex-grow sm:flex-grow-0"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
));

const SchedulePage = ({ SidebarComponent, menuItems, title }) => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });

  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const currentUser = getStoredUser();
  const currentUserId = currentUser?.id;
  const currentRoleId = Number(currentUser?.role_id);
  const isAdmin = currentRoleId === 1;
  const canAccess = ALLOWED_ROLES.has(currentRoleId);

  const [events, setEvents] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    notes: '',
    assigned_office_id: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOfficeLocked, setIsOfficeLocked] = useState(false);
  const [isPendingView, setIsPendingView] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/loginpage', { replace: true });
    }
  }, [navigate, token]);

  const fetchOffices = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/common-datas`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch offices');
      }
      const data = await response.json();
      setOffices(Array.isArray(data.offices) ? data.offices : []);
    } catch (err) {
      setOffices([]);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!token || !canAccess) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/schedule-events`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
      const data = await response.json();
      const eventData = Array.isArray(data) ? data : data.data || [];
      setEvents(eventData);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [token, canAccess]);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (!canAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Authorized</h2>
        <p className="text-gray-600 mb-4">You do not have access to schedules.</p>
        <button
          onClick={() => navigate('/dashboard', { replace: true })}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const resetForm = () => {
    setNewEvent({
      title: '',
      date: '',
      time: '',
      location: '',
      notes: '',
      assigned_office_id: '',
    });
    setEditingEventId(null);
    setIsOfficeLocked(false);
  };

  const handleSaveEvent = async () => {
    if (!editingEventId) {
      setError('New schedules are created from approved maintenance requests.');
      return;
    }
    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.assigned_office_id) {
      setError('Title, date, time, and assigned office are required.');
      return;
    }

    try {
      setError(null);
      const payload = {
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time,
        location: newEvent.location || null,
        notes: newEvent.notes || null,
        assigned_office_id: Number(newEvent.assigned_office_id),
      };

      const response = await fetch(
        editingEventId
          ? `${API_BASE_URL}/schedule-events/${editingEventId}`
          : `${API_BASE_URL}/schedule-events`,
        {
          method: editingEventId ? 'PUT' : 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save event');
      }

      await fetchEvents();
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Failed to save event');
    }
  };

  const handleEditEvent = (event) => {
    setEditingEventId(event.id);
    setNewEvent({
      title: event.title || '',
      date: event.date || '',
      time: normalizeTimeInput(event.time),
      location: event.location || '',
      notes: event.notes || '',
      assigned_office_id: event.assigned_office_id ? String(event.assigned_office_id) : '',
    });
    setIsOfficeLocked(Boolean(event.maintenance_request_id));
    setShowForm(true);
    setIsModalOpen(false);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this schedule event?')) return;
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/schedule-events/${eventId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete event');
      }
      await fetchEvents();
    } catch (err) {
      setError(err.message || 'Failed to delete event');
    }
  };

  const getOfficeName = (event) => {
    if (event.office?.name) return event.office.name;
    const office = offices.find((item) => item.id === event.assigned_office_id);
    return office ? office.name : 'Unknown Office';
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const formatDate = (day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const generateCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<td key={`empty-${i}`} className="p-2 border border-gray-100 text-gray-300"></td>);
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(day);
      const dayEvents = events.filter((event) => event.date === date);
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

      days.push(
        <td
          key={day}
          className={`p-2 border border-gray-100 align-top h-24 md:h-32 relative cursor-pointer transition-colors hover:bg-blue-50 ${
            isToday ? 'bg-blue-50' : ''
          }`}
          onClick={() => {
            setSelectedDate(date);
            setIsModalOpen(true);
          }}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="text-xs bg-gray-200 rounded-full h-5 w-5 flex items-center justify-center text-gray-700">
                {dayEvents.length}
              </span>
            )}
          </div>
          <div className="overflow-y-auto max-h-20">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className="bg-blue-100 p-1 mb-1 rounded text-xs overflow-hidden"
                title={`${event.title} - ${event.time} (${getOfficeName(event)})`}
              >
                <div className="font-medium truncate">{event.title}</div>
                <div className="text-gray-600">{normalizeTimeInput(event.time)}</div>
              </div>
            ))}
          </div>
        </td>
      );
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const weeks = [];
  let week = [];

  for (let i = 0; i < calendarDays.length; i++) {
    week.push(calendarDays[i]);

    if ((i + 1) % 7 === 0 || i === calendarDays.length - 1) {
      if (i === calendarDays.length - 1 && week.length < 7) {
        const remainingCells = 7 - week.length;
        for (let j = 0; j < remainingCells; j++) {
          week.push(<td key={`empty-end-${j}`} className="p-2 border border-gray-100 text-gray-300"></td>);
        }
      }

      weeks.push(<tr key={`week-${weeks.length}`}>{week}</tr>);
      week = [];
    }
  }

  const selectedDayEvents = selectedDate
    ? events.filter((event) => event.date === selectedDate)
    : [];

  const todayString = new Date().toISOString().split('T')[0];
  const pendingSchedules = events.filter(e => e.date >= todayString);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        isMobileMenuOpen={state.isMobileMenuOpen}
        onToggleMobileMenu={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
        onCloseMobileMenu={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
        menuItems={menuItems}
        title={title}
      />

      <div className="flex flex-1 overflow-hidden">
        <SidebarComponent
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={menuItems}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-white/95 backdrop-blur-sm overflow-y-auto">
          <div className="flex justify-between items-center mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-200">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900">
              Schedules
            </h2>
            <button
              onClick={() => setIsPendingView(!isPendingView)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
              {isPendingView ? "View Calendar" : "View Pending"}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {showForm && (
            <EventForm
              newEvent={newEvent}
              setNewEvent={setNewEvent}
              handleSaveEvent={handleSaveEvent}
              closeForm={() => {
                resetForm();
                setShowForm(false);
              }}
              offices={offices}
              isEditing={Boolean(editingEventId)}
              isOfficeLocked={isOfficeLocked}
            />
          )}

          {isPendingView ? (
            <div className="bg-white rounded-lg shadow-sm md:shadow-lg border border-gray-200 mb-4 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-3 font-semibold text-gray-700 w-1/4">Date</th>
                    <th className="p-3 font-semibold text-gray-700 flex-1">Event Title</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSchedules.length > 0 ? (
                    pendingSchedules.map((event) => (
                      <tr
                        key={event.id}
                        onClick={() => {
                          setSelectedDate(event.date);
                          setIsModalOpen(true);
                        }}
                        className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <td className="p-3 text-gray-600">
                          {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="p-3 font-medium text-gray-900">{event.title}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="p-4 text-center text-gray-500">
                        No pending schedules found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm md:shadow-lg border border-gray-200 mb-4">
              <CalendarHeader
                currentDate={currentDate}
                prevMonth={prevMonth}
                nextMonth={nextMonth}
              />

              <div className="p-2 sm:p-4 overflow-x-auto">
                <div className="min-w-[768px]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <th key={day} className="border border-gray-100 p-2 text-sm font-semibold text-gray-700">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>{weeks}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div className="font-semibold text-gray-900">
                {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Schedule Details'}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold leading-none"
                aria-label="Close"
              >
                x
              </button>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="text-sm text-gray-500">Loading schedules...</div>
              ) : selectedDayEvents.length === 0 ? (
                <div className="text-sm text-gray-500">No schedules for this day.</div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((event) => {
                    const canModify = isAdmin || String(event.created_by) === String(currentUserId);
                    return (
                      <div key={event.id} className="border border-gray-100 rounded-lg p-3">
                        <div className="font-semibold text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Time: {normalizeTimeInput(event.time)}
                        </div>
                        <div className="text-sm text-gray-600">Office: {getOfficeName(event)}</div>
                        {event.location && (
                          <div className="text-sm text-gray-600">Location: {event.location}</div>
                        )}
                        {event.notes && (
                          <div className="text-sm text-gray-600">Notes: {event.notes}</div>
                        )}
                        {canModify && (
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="px-3 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="px-3 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
