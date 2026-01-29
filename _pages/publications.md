---
layout: archive
title: "Research"
permalink: /publications/
author_profile: true
---

You can also find my full list of publications on <u><a href="https://scholar.google.com/citations?view_op=list_works&hl=en&hl=en&user=B9MMJM0AAAAJ">my Google Scholar profile</a>.</u>

{% include base_path %}

{% for post in site.publications reversed %}
  {% include archive-single.html %}
{% endfor %}
