-- Fields the events UI shows beyond the basics: a level, a Luma checkout id,
-- materials shared afterwards (slides, recordings, labs) and the flyer's
-- pixel size, so the page reserves its space before the image loads.
-- Constraints mirror the site's own rules (src/lib/events/sheet.ts).

alter table public.events
  add column difficulty    text not null default '' check (difficulty in ('', 'Beginner', 'Intermediate', 'Advanced', 'All Levels')),
  add column luma_event_id text not null default '' check (luma_event_id ~ '^(evt-[A-Za-z0-9]+)?$' and char_length(luma_event_id) <= 64),
  add column links         jsonb not null default '[]'::jsonb check (jsonb_typeof(links) = 'array' and jsonb_array_length(links) <= 10),
  add column image_width   integer check (image_width between 1 and 10000),
  add column image_height  integer check (image_height between 1 and 10000);

-- The events the site listed in code before the admin page existed. Their
-- flyers stay in public/assets/events. Re-running is harmless.
insert into public.events (id, title, description, date, start_time, end_time, location, category, difficulty, registration_url, luma_event_id, image_url, image_alt, image_width, image_height, published)
values
  ('2026-09-02-general-body-meeting', 'General Body Meeting',
   'First meeting of the Fall 2026 semester.',
   '2026-09-02', '15:00', '16:00', 'CMII Building Room 211', 'General Body Meeting', 'All Levels', '', '',
   '/assets/events/general-body.webp',
   'Flyer reading: Wednesday, first meeting of the Fall 2026 semester, CMII Building Room 211, September 2, 3:00 to 4:00 pm.',
   1000, 988, true),
  ('2026-09-11-cybersecurity-fundamentals', 'Mastering Cybersecurity Fundamentals',
   'The core ideas behind attacking and defending systems, for people with no security background.',
   '2026-09-11', null, null, '', 'Workshop', 'Beginner', '', '',
   '/assets/events/fundamentals.webp',
   'Flyer reading: Join us for our Mastering Cybersecurity Fundamentals workshop, over a background of code.',
   1000, 1003, true),
  ('2026-09-22-resume-workshop', 'Resume Workshop',
   'GSU tech clubs present a resume workshop.',
   '2026-09-22', '17:30', '19:30', 'CLSO 150', 'Career', '', '', '',
   '/assets/events/resume-workshop.webp',
   'Flyer reading: GSU tech clubs present resume workshop, September 22nd, CLSO 150, 5:30 to 7:30 pm.',
   900, 1125, true),
  ('2026-10-07-jerry-perullo-talk', 'From CISO to CEO: A Talk with Jerry Perullo',
   $d$An exclusive conversation with Jerry Perullo, founding CISO of ICE/New York Stock Exchange, CEO of Adversarial Risk Management and proud GSU MBA alum, on lessons from more than 20 years leading cybersecurity at the highest levels. After two decades at ICE/NYSE he stepped in as Interim CISO at Silicon Valley Bank, then founded Adversarial Risk Management, a SaaS cyber risk management platform. He is also a Professor of the Practice at Georgia Tech, teaching Enterprise Cybersecurity Management to more than 400 students each semester.$d$,
   '2026-10-07', '15:00', '16:00', 'CMII Building Room 211', 'Speaker', 'All Levels', 'https://pin.gsu.edu/event/12843457', '',
   '/assets/events/jerry-perullo.webp',
   'Flyer reading: From CISO to CEO, a talk with Jerry Perullo, founding CISO of ICE/NYSE, CEO of Adversarial Risk Management and GSU MBA alum. Wednesday, October 7th, 3:00 to 4:00 pm, CMII Building Room 211. Includes a photo of Jerry Perullo.',
   1000, 1000, true),
  ('2026-10-14-alumni-panel', 'Familiar Faces: A Cybersecurity Alumni Panel',
   $d$An exclusive panel with two GSU alumni making moves in the industry. Jhante Charles (@Cloudtechexec) is a Cloud Engineer at Nokia and a cybersecurity and cloud technology content creator with more than 200K followers across social media. Juwan Rogers is an Incident Response Consultant at Palo Alto Networks Unit 42 with a Master's in Digital Forensics from UCF. Hear how both went from GSU to careers in tech and cybersecurity, get real-world insight into cloud engineering, incident response and digital forensics, learn about internships, networking and breaking into the field, and ask your own questions during the live Q&A.$d$,
   '2026-10-14', '18:00', null, '55 Park Place, Room 1108', 'Speaker', 'All Levels', 'https://pin.gsu.edu/event/12868591', '',
   '/assets/events/alumni-panel.webp',
   'Flyer reading: Familiar Faces, Cybersecurity Alumni Panel, October 14th at 6:00 PM, 55 Park Place, Room 1108. Includes photos of the panelists: Jhante Charles, aka @Cloudtechexec, Cloud Engineer at Nokia, and Juwan Rogers, Incident Response Consultant at Palo Alto Networks Unit 42.',
   600, 592, true),
  ('2026-10-21-inheritance-protocol', 'The Inheritance Protocol: A Cyber Mystery',
   $d$One mansion. One inheritance. Too many secrets. Behind the locked gates of a secluded smart mansion, an exclusive Halloween dinner takes a deadly turn. Work with your team to explore digital evidence, uncover family secrets and piece together the truth, from smart-home logs and Git history to hashes and steganography. The first team to crack the case wins TryHackMe Premium subscription vouchers. Presented with Girls Who Code and TryHackMe.$d$,
   '2026-10-21', '17:30', '19:00', 'Library South 102', 'CTF', 'All Levels', 'https://pin.gsu.edu/event/12886687', 'evt-36OCwMiom4FIR00',
   '/assets/events/inheritance-protocol.webp',
   'Flyer reading: The Inheritance Protocol, a cyber mystery. October 21st, 5:30 to 7:00 pm, Library South 102. Work with your team to solve the mystery. Presented by Girls Who Code, the GSU Cybersecurity Club and TryHackMe. A mansion. A dead founder. Who did it?',
   1000, 1250, true)
on conflict (id) do nothing;
