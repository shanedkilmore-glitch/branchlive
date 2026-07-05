import re

with open('worker.js', 'r', encoding='utf-8') as f:
    c = f.read()

old_article = """case 'leads': return `<p class="hc-lead">Every caller becomes a lead. Track prospects from initial contact to the final close \\u2014 Emma handles intake, you handle the relationship.</p>

<h2>Lead statuses</h2>
<p>Each lead moves through a structured pipeline so your team knows exactly who to follow up with next:</p>
<ul>
  <li><strong>New:</strong> A prospect who called in but has not yet been contacted by you.</li>
  <li><strong>Contacted:</strong> You have reached out via phone call, text message, or email.</li>
  <li><strong>Scheduled:</strong> A temporary or unconfirmed hold has been placed on your calendar.</li>
  <li><strong>Booked:</strong> The appointment is confirmed and ready for your crew.</li>
  <li><strong>Closed:</strong> The job was either won or lost, and the lead is marked inactive.</li>
</ul>

<h2>Concrete intake example</h2>
<p>When a customer calls asking about deck sealing, Emma checks if they are in your database. If not, she automatically asks for their name and details, then creates a <strong>New</strong> lead record containing their phone number and notes, ready for your immediate follow-up.</p>

<h2>Step-by-step instructions</h2>
<ol>
  <li>Open the <a href=\"/p/leads\">Leads</a> page to view your active funnel.</li>
  <li>Click on any lead's name to open their profile, edit their details, or add custom follow-up notes.</li>
  <li>To update a status manually, select the new status from the dropdown menu on the lead's card.</li>
  <li>For bulk updates, check the boxes next to multiple leads, select a new status, and click <strong>Bulk Update</strong>.</li>
</ol>

<h2>Troubleshooting tips</h2>
<ul>
  <li><strong>Duplicate leads:</strong> If a customer calls from a different number, a separate lead is created. Merge them by editing the phone fields or manually closing the duplicate.</li>
  <li><strong>Missing names:</strong> When callers hang up early, Emma logs them as "Unknown Caller". Open the lead, listen to the call recording, and manually update the name once verified.</li>
</ul>

<div class="hc-callout"><span class="hc-co-h">Pipeline Goal</span><p>Move leads systematically through the pipeline to track your business metrics. Check conversion rates on the <a href=\"/p/analytics\">Analytics</a> page.</p></div>`;"""

new_article = """case 'leads': return `<p class="hc-lead">Every caller becomes a lead. Track prospects from initial contact to the final booking — Emma handles the automated intake, while you use powerful follow-up, scheduling, and AI tools to manage client relationships.</p>

<h2>Lead statuses</h2>
<p>Each lead moves through a structured pipeline, helping your business know exactly where each prospect stands. The five pipeline statuses are:</p>
<ul>
  <li><strong>New:</strong> A prospect who called in but has not yet been contacted by you.</li>
  <li><strong>Contacted:</strong> You have reached out to the prospect via phone call, text message, or email.</li>
  <li><strong>Scheduled:</strong> A temporary or unconfirmed hold has been placed on your calendar.</li>
  <li><strong>Booked:</strong> The appointment is confirmed and ready on your calendar.</li>
  <li><strong>Closed:</strong> The prospect was either won or lost, and the lead record is marked inactive.</li>
</ul>

<h2>Reviewing call recordings and AI summaries</h2>
<p>Every lead profile displays complete records of the client's phone conversations. You can quickly review past calls using two powerful tools:</p>
<ul>
  <li><strong>Call transcript summaries:</strong> Located right above the raw transcript card, the AI-generated key points outline crucial details like requested services, price quotes, and dates. Each key point is marked with a distinctive amber bullet so you can scan the conversation in seconds.</li>
  <li><strong>Audio playback:</strong> Listen to the conversation directly in the lead detail view using the built-in HTML5 audio player to capture tone, sentiment, and specific verbal requests.</li>
</ul>

<h2>Booking appointments directly from leads</h2>
<p>When you are ready to confirm a booking, click the <strong>Book Appointment</strong> button on the lead detail page. This opens an inline booking form that pre-fills the client's information. Completing this form creates an official calendar appointment directly from the lead record and automatically transitions their status to <strong>Booked</strong>.</p>

<h2>Follow-ups and booking link sharing</h2>
<p>Easily share your scheduling availability when communicating with prospects:</p>
<ul>
  <li><strong>Email follow-ups:</strong> Send emails from the lead detail view. Check the <strong>Add booking link</strong> checkbox next to the Send button to automatically insert your direct booking page link into your message.</li>
  <li><strong>SMS follow-ups:</strong> Send texts to follow up on a call. In the SMS preview dialog, check the <strong>Add booking link</strong> box to embed your calendar link directly in the outgoing text message.</li>
</ul>

<h2>Interaction history widgets</h2>
<p>Stay on top of all communications with dedicated widgets built directly into the lead detail view:</p>
<ul>
  <li><strong>SMS follow-up history:</strong> Displays a chronological log of all outgoing and incoming text messages exchanged with the prospect.</li>
  <li><strong>Seasonal follow-ups history:</strong> Tracks marketing campaigns, seasonal promos, and re-engagement texts sent to this client over time.</li>
</ul>

<h2>Scout AI assistant</h2>
<p>Get instant assistance directly within the lead view. Click the <strong>Scout AI assistant</strong> button (marked with a ✨ sparkle icon) to open a workspace helper. Scout can write personalized follow-up drafts, answer questions about client history, or recommend the best next steps based on recent interactions.</p>

<h2>Concrete intake example</h2>
<p>Imagine a client calls your photography studio inquiring about a family portrait package. Emma greets the caller, answers questions about package pricing from your Knowledge Base, and captures their contact information. A <strong>New</strong> lead is instantly created. You open their profile, read the AI-generated transcript summary ("Wants outdoor family shoot; Preferred weekend in October; Budget is standard package"), listen to the recording to catch their excitement, and click <strong>Book Appointment</strong> to confirm their session date.</p>

<h2>Step-by-step instructions</h2>
<ol>
  <li>Navigate to the <a href="/p/leads">Leads</a> page to view your active pipeline.</li>
  <li>Click on a lead's name to open their profile details.</li>
  <li>Review the AI-generated call transcript summary at the top of the transcript card, and use the HTML5 audio player to listen to the call recording.</li>
  <li>Click the ✨ Scout AI assistant icon for recommendations or assistance with the lead.</li>
  <li>Follow up with the lead by sending an SMS or email. Check the <strong>Add booking link</strong> box to embed your booking calendar.</li>
  <li>To book the appointment, click <strong>Book Appointment</strong>, complete the inline form, and save to update your calendar.</li>
  <li>Monitor the <strong>SMS follow-up history</strong> and <strong>Seasonal follow-ups history</strong> widgets to check on previous communication logs.</li>
</ol>

<h2>Troubleshooting tips</h2>
<ul>
  <li><strong>Missing booking link option:</strong> If you don't see the <em>Add booking link</em> checkbox, verify that you have a published site with online booking enabled in <a href="/settings-htmx">Settings</a>.</li>
  <li><strong>Audio playback issues:</strong> If the call recording player doesn't play audio, check your internet connection or reload the page. Some browsers restrict auto-play or audio output permissions.</li>
  <li><strong>Scout not responding:</strong> If the ✨ Scout assistant is not generating suggestions, ensure the lead has at least one recorded call or message history for Scout to analyze.</li>
</ul>

<div class="hc-callout"><span class="hc-co-h">Pipeline Goal</span><p>Move leads systematically through the pipeline (New → Contacted → Scheduled → Booked → Closed). Check your conversion rates on the <a href="/p/analytics">Analytics</a> page.</p></div>`;"""

if old_article in c:
    c = c.replace(old_article, new_article)
    with open('worker.js', 'w', encoding='utf-8') as f:
        f.write(c)
    print('Article updated successfully')
else:
    print('Old article text not found exactly — may have formatting differences')
    # Show what the file has at the leads case
    idx = c.find("case 'leads': return `")
    if idx > 0:
        snippet = c[idx:idx+100]
        print(f'File has: {repr(snippet)}')
