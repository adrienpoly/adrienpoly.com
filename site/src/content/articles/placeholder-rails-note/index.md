---
title: "Placeholder: a short technical note"
description: "A fake article shaped like a typical post: some prose, a few code samples and one quote."
pubDate: 2026-11-12
draft: true
---

This is a placeholder. The text is filler; the shape is what a real note would look like.

Say a page shows a countdown. The server knows when it started, the browser only has to draw it. The model stays small:

```ruby title="app/models/countdown.rb"
class Countdown < ApplicationRecord
  validates :duration, numericality: { greater_than: 0 }

  def ends_at
    started_at + duration.seconds
  end

  def remaining(now: Time.current)
    [ends_at - now, 0].max
  end
end
```

The view passes the end time to a controller:

```erb title="app/views/countdowns/show.html.erb"
<div data-controller="countdown"
     data-countdown-ends-at-value="<%= @countdown.ends_at.iso8601 %>">
  <span data-countdown-target="output"></span>
</div>
```

And the controller computes what is left from the clock, never by counting ticks, so a sleeping tab can't make it drift:

```js title="app/javascript/controllers/countdown_controller.js"
export default class extends Controller {
  static targets = ["output"]
  static values = { endsAt: String }

  connect() {
    this.tick()
    this.interval = setInterval(() => this.tick(), 250)
  }

  disconnect() {
    clearInterval(this.interval)
  }

  tick() {
    const remaining = Math.max(0, new Date(this.endsAtValue) - Date.now())
    this.outputTarget.textContent = Math.ceil(remaining / 1000)
  }
}
```

> Make it work, make it right, make it fast.
>
> — Kent Beck

That order applies here too.[^order]

[^order]: The first version polled the server every second. It worked, which was enough to learn what the page needed.
