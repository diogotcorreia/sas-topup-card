# SAS Topup Card

Automated tool that controls a Chromium browser to topup a ULisboa SAS card
with authentication through Fénix IST.

## Why?

Why not?

## Using this

Copy `.env.example` to `.env` and replace the variables accordingly.

The `ACCESS_TOKEN` env var behaves like a password: the code only runs if the
request has the correct token, to avoid unauthorized users to control your
Técnico account.

To topup, send the following request:

- `GET /topup?count=<count>`
  - `count` is how many meals to topup (i.e. you'll topup 2.75€ \* `count`)
  - with header `Authorization: Bearer <ACCESS_TOKEN>`

## Performance

Since this launches a Chromium launcher and navigates various pages, it's
bound to be slow.

On my machine, it takes about 14 seconds to run.
On lower end hardware it might take a bit longer.
