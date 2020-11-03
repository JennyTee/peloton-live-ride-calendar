var calendarId = 'primary';

function createEvent(ride, encoreClassStartTime) {
  var startTime = !!encoreClassStartTime ? encoreClassStartTime * 1000 : ride.scheduled_start_time * 1000;
  var endTime = startTime + (ride.duration * 1000);
  
  var summary = buildEventSummary(ride, encoreClassStartTime);
  
  var event = {
    summary: summary,
    location: getInstructorName(ride.instructor_id),
    description: ride.description,
    start: {
      dateTime: new Date(startTime).toISOString()
    },
    end: {
      dateTime: new Date(endTime).toISOString()
    },
    colorId: !!encoreClassStartTime ? 3 : 2,
    // Extended properties are not currently displayed in created calendar events. They are just metadata tags.
    extendedProperties: {
      shared: {
        classLength: ride.duration / 60,
        classId: ride.id,
        classType: ride.fitness_discipline_display_name,
        hasClosedCaptions: ride.has_closed_captions,
        instructor: getInstructorName(ride.instructor_id),
        language: ride.language
      }
    }
  };
  event = Calendar.Events.insert(event, calendarId);
  return event;
}

function buildEventSummary(ride, encoreClassStartTime) {
  var foreignLanguageIndicator = '';
  // If rides are offered in other languages someday, this will need to be updated.
  if (ride.origin_locale == 'de-DE') {
    foreignLanguageIndicator = ' [German]';
  }
  var encoreIndicator = !!encoreClassStartTime ? ' [Encore]' : '';
  
  var eventSummary = `${ride.title}${foreignLanguageIndicator}${encoreIndicator}`;
  return eventSummary;
}

function getUpcomingPelotonCalendarEvents() {
  var existingEvents = new Map();
  var now = new Date();
  var events = Calendar.Events.list(calendarId, {
    timeMin: now.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 500
  });
  if (events.items && events.items.length > 0) {
    for (var i = 0; i < events.items.length; i++) {
      var event = events.items[i];
      var extendedProperties = event.getExtendedProperties()
      if (!extendedProperties) { 
        continue;
      }
      var sharedExtendedProperties = extendedProperties.getShared();
      if (!!sharedExtendedProperties && sharedExtendedProperties.classId != null) {
        existingEvents.set(sharedExtendedProperties.classId, event);
      }
    }
  }
  return existingEvents;
}

function deleteEventById(eventId) {
  try {
    var event = CalendarApp.getCalendarById(calendarId).getEventById(eventId);
    event.deleteEvent();
  } catch(e) {
    console.error("Error deleting event " + event.getSummary() + ' with ' + event.getLocation() + ' on ' + 
      event.getStartTime() + ". Error: " + e);
  }
}

// used for testing
function deleteAllEvents() {
  var existingEvents = getAllPelotonCalendarEventIds();
  for (var i = 0; i < existingEvents.length; i++) {
    var eventId = existingEvents[i];
    deleteEventById(eventId);
  }
}

// used for testing
function getAllPelotonCalendarEventIds() {
  var eventIds = [];
  var startDate = new Date(2018, 11, 24, 10, 33, 30, 0);
  var events = Calendar.Events.list(calendarId, {
    timeMin: startDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 500
  });
  if (events.items && events.items.length > 0) {
    for (var i = 0; i < events.items.length; i++) {
      var event = events.items[i];
      var extendedProperties = event.getExtendedProperties()
      if (!extendedProperties) { 
        continue;
      }
      var sharedExtendedProperties = extendedProperties.getShared();
      if (!!sharedExtendedProperties && sharedExtendedProperties.classId != null) {
        eventIds.push(event.id);
      }
    }
  }

  return eventIds;
}
