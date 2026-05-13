from pydantic import BaseModel
from typing import Optional
 
 
class EventResponse(BaseModel):
    """
    Field names match what the React frontend already expects
    (id, name, date, genre, location, venue, ticketPrice, ticketLink, isADAComp).
    """
    id:          str
    name:        str
    genre:       str
    date:        str
    location:    str
    venue:       str
    ticketPrice: float
    ticketLink:  str
    isADAComp:   bool
 
    model_config = {"from_attributes": True}