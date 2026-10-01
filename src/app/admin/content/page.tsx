import Image from "next/image";

import { AdminMediaUploader } from "@/components/admin-media-uploader";
import { ImageLightbox } from "@/components/image-lightbox";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAdminContent } from "@/lib/admin-content";
import { isSupabaseStorageConfigured } from "@/lib/supabase-admin";
import {
  createBannerAction,
  createFeedbackAction,
  deleteBannerAction,
  deleteFeedbackAction,
  deleteMediaAction,
  toggleBannerAction,
  toggleFeedbackAction,
  updateBannerAction,
  updateFeedbackAction,
  updateMediaAction,
  updatePolicyAction,
} from "./actions";

export const metadata = { title: "Content | Admin" };

function dateTimeValue(value: Date | null) {
  if (!value) return "";
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export default async function AdminContentPage() {
  const { media, banners, policies, feedback } = await getAdminContent();
  const uploadsEnabled = isSupabaseStorageConfigured();
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">
        Storefront publishing
      </p>
      <h2 className="mt-3 font-heading text-5xl">Content</h2>
      <p className="mt-3 text-muted-foreground">
        Upload approved imagery and maintain the homepage hero, banners,
        customer feedback, and policy copy.
      </p>
      <Card className="mt-6 rounded-none">
        <CardHeader>
          <CardTitle className="font-heading text-3xl">Media library</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-5 text-sm leading-6 text-muted-foreground">
            Every image uploaded anywhere in the admin (products, banners,
            customer feedback, or here) is stored once in Supabase Storage and
            listed here. Use it to fix alt text and to delete files nothing uses
            anymore. Showing the 30 most recent; click a thumbnail to enlarge.
          </p>
          <AdminMediaUploader enabled={uploadsEnabled} label="media images" />
          {media.length ? (
            <ul className="mt-5 max-h-[32rem] divide-y overflow-y-auto overscroll-contain border">
              {media.map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 p-3"
                >
                  <ImageLightbox
                    src={item.url}
                    alt={item.altText || item.originalName}
                    className="relative size-16 overflow-hidden bg-muted outline-offset-2 hover:opacity-90"
                  >
                    <Image
                      src={item.url}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </ImageLightbox>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.originalName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.mimeType.replace("image/", "").toUpperCase()} ·{" "}
                      {(item.size / 1024).toFixed(0)} KB
                      {item.width && item.height
                        ? ` · ${item.width} × ${item.height}`
                        : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <form
                        action={updateMediaAction.bind(null, item.id)}
                        className="flex min-w-0 flex-1 gap-2"
                      >
                        <Input
                          name="altText"
                          defaultValue={item.altText ?? ""}
                          aria-label="Media alt text"
                          required
                          maxLength={255}
                          className="h-8 min-w-0 text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-none"
                        >
                          Save
                        </Button>
                      </form>
                      <form action={deleteMediaAction.bind(null, item.id)}>
                        <ConfirmSubmitButton message="Permanently delete this unused media file from Supabase Storage?">
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {!media.length ? (
            <p className="mt-5 text-center text-sm text-muted-foreground">
              No uploaded media yet.
            </p>
          ) : null}
        </CardContent>
      </Card>
      <Card className="mt-6 rounded-none">
        <CardHeader>
          <CardTitle className="font-heading text-3xl">
            Homepage banners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-5 text-sm leading-6 text-muted-foreground">
            Active banners appear as the main homepage hero. Use a landscape
            image—ideally 1920 × 1080 or wider. The storefront crops it
            responsively around the center. Leave both dates empty to publish
            immediately and indefinitely.
          </p>
          <form
            action={createBannerAction}
            className="grid gap-3 sm:grid-cols-2"
          >
            <Input name="title" placeholder="Title" required />
            <Input name="subtitle" placeholder="Subtitle" />
            <div className="sm:col-span-2">
              <AdminMediaUploader
                enabled={uploadsEnabled}
                fieldName="image"
                label="banner image"
                multiple={false}
              />
            </div>
            <Input name="ctaText" placeholder="Button label" />
            <Input name="ctaLink" placeholder="/shop" />
            <div>
              <Label htmlFor="banner-start">Starts (optional)</Label>
              <Input id="banner-start" name="startDate" type="datetime-local" />
            </div>
            <div>
              <Label htmlFor="banner-end">Ends (optional)</Label>
              <Input id="banner-end" name="endDate" type="datetime-local" />
            </div>
            <div>
              <Label htmlFor="banner-order">Display order</Label>
              <Input
                id="banner-order"
                name="displayOrder"
                type="number"
                min="0"
                defaultValue="0"
              />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" name="isActive" /> Active on homepage
            </label>
            <Button className="rounded-none sm:col-span-2">
              Create banner
            </Button>
          </form>
          <div className="mt-7 space-y-4">
            {banners.map((banner) => (
              <details
                key={banner.id}
                className="border"
                open={banners.length === 1}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {banner.title}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="outline" className="rounded-none">
                        {banner.isActive ? "active" : "inactive"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        order {banner.displayOrder}
                      </span>
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">Edit</span>
                </summary>
                <div className="border-t p-4">
                  <ImageLightbox
                    src={banner.image}
                    alt={banner.title}
                    className="relative mb-4 block aspect-video w-48 overflow-hidden bg-muted hover:opacity-90"
                  >
                    <Image
                      src={banner.image}
                      alt=""
                      fill
                      sizes="192px"
                      className="object-cover"
                    />
                  </ImageLightbox>
                  <form
                    action={updateBannerAction.bind(null, banner.id)}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <Input
                      name="title"
                      defaultValue={banner.title}
                      aria-label="Banner title"
                      required
                    />
                    <Input
                      name="subtitle"
                      defaultValue={banner.subtitle ?? ""}
                      aria-label="Banner subtitle"
                      placeholder="Subtitle"
                    />
                    <input type="hidden" name="image" value={banner.image} />
                    <div className="sm:col-span-2">
                      <AdminMediaUploader
                        enabled={uploadsEnabled}
                        fieldName="image"
                        label="replacement banner image"
                        multiple={false}
                      />
                    </div>
                    <Input
                      name="ctaText"
                      defaultValue={banner.ctaText ?? ""}
                      aria-label="Button label"
                      placeholder="Button label"
                    />
                    <Input
                      name="ctaLink"
                      defaultValue={banner.ctaLink ?? ""}
                      aria-label="Button link"
                      placeholder="/shop"
                    />
                    <div>
                      <Label htmlFor={`start-${banner.id}`}>Starts</Label>
                      <Input
                        id={`start-${banner.id}`}
                        name="startDate"
                        type="datetime-local"
                        defaultValue={dateTimeValue(banner.startDate)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`end-${banner.id}`}>Ends</Label>
                      <Input
                        id={`end-${banner.id}`}
                        name="endDate"
                        type="datetime-local"
                        defaultValue={dateTimeValue(banner.endDate)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`order-${banner.id}`}>
                        Display order
                      </Label>
                      <Input
                        id={`order-${banner.id}`}
                        name="displayOrder"
                        type="number"
                        min="0"
                        defaultValue={banner.displayOrder}
                      />
                    </div>
                    <label className="flex items-center gap-2 self-end pb-2 text-sm">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={banner.isActive}
                      />{" "}
                      Active on homepage
                    </label>
                    <Button className="rounded-none sm:col-span-2">
                      Save banner
                    </Button>
                  </form>
                  <div className="mt-3 flex flex-wrap justify-between gap-2">
                    <form action={toggleBannerAction.bind(null, banner.id)}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none"
                      >
                        {banner.isActive ? "Disable" : "Enable"}
                      </Button>
                    </form>
                    <form action={deleteBannerAction.bind(null, banner.id)}>
                      <ConfirmSubmitButton
                        message={`Delete “${banner.title}”? This removes the banner record, but keeps its uploaded image in the media library.`}
                      >
                        Delete banner
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </details>
            ))}
          </div>
          {!banners.length ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No banners yet. The default Talié hero is currently shown.
            </p>
          ) : null}
        </CardContent>
      </Card>
      <Card id="customer-feedback" className="mt-6 rounded-none">
        <CardHeader>
          <CardTitle className="font-heading text-3xl">
            Customer feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-5 max-w-3xl text-sm leading-6 text-muted-foreground">
            Upload screenshots of customer messages and reviews. Visible items
            appear in the “Customer love” section on the homepage, in display
            order. Crop out phone numbers and other personal details before
            uploading, and only share feedback customers are happy to have
            published.
          </p>
          <form
            action={createFeedbackAction}
            className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
          >
            <AdminMediaUploader
              enabled={uploadsEnabled}
              fieldName="image"
              label="feedback screenshots"
              defaultAltText="Customer feedback screenshot"
            />
            <div className="grid content-start gap-3">
              <div>
                <Label htmlFor="feedback-name">Customer name (optional)</Label>
                <Input
                  id="feedback-name"
                  name="customerName"
                  maxLength={80}
                  placeholder="e.g. Mariam, Cairo"
                />
              </div>
              <div>
                <Label htmlFor="feedback-caption">Caption (optional)</Label>
                <Textarea
                  id="feedback-caption"
                  name="caption"
                  maxLength={240}
                  rows={3}
                  placeholder="Short quote or context shown under the screenshot"
                />
              </div>
              <div>
                <Label htmlFor="feedback-order">Display order</Label>
                <Input
                  id="feedback-order"
                  name="displayOrder"
                  type="number"
                  min="0"
                  defaultValue="0"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isActive" defaultChecked /> Show on
                homepage
              </label>
              <Button className="rounded-none">Add to feedback wall</Button>
              <p className="text-xs text-muted-foreground">
                Name and caption apply to every screenshot in this upload; edit
                each one individually below.
              </p>
            </div>
          </form>
          {feedback.length ? (
            <ul className="mt-7 max-h-[36rem] divide-y overflow-y-auto overscroll-contain border">
              {feedback.map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[5rem_minmax(0,1fr)]"
                >
                  <ImageLightbox
                    src={item.image}
                    alt={item.altText ?? "Customer feedback screenshot"}
                    caption={
                      item.caption || item.customerName
                        ? `${item.caption ?? ""}${item.customerName ? ` — ${item.customerName}` : ""}`
                        : undefined
                    }
                    className="relative h-24 w-16 overflow-hidden bg-muted hover:opacity-90 sm:h-28 sm:w-20"
                  >
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover object-top"
                    />
                  </ImageLightbox>
                  <div className="min-w-0">
                    <form
                      action={updateFeedbackAction.bind(null, item.id)}
                      className="grid gap-2 sm:grid-cols-2"
                    >
                      <Input
                        name="customerName"
                        defaultValue={item.customerName ?? ""}
                        maxLength={80}
                        aria-label="Customer name"
                        placeholder="Customer name"
                        className="h-8 text-xs"
                      />
                      <Input
                        name="altText"
                        defaultValue={item.altText ?? ""}
                        maxLength={255}
                        aria-label="Alt text"
                        placeholder="Alt text"
                        className="h-8 text-xs"
                      />
                      <Input
                        name="caption"
                        defaultValue={item.caption ?? ""}
                        maxLength={240}
                        aria-label="Caption"
                        placeholder="Caption"
                        className="h-8 text-xs sm:col-span-2"
                      />
                      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                        <Input
                          name="displayOrder"
                          type="number"
                          min="0"
                          defaultValue={item.displayOrder}
                          aria-label="Display order"
                          className="h-8 w-20 text-xs"
                        />
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            name="isActive"
                            defaultChecked={item.isActive}
                          />{" "}
                          Visible
                        </label>
                        <Badge variant="outline" className="rounded-none">
                          {item.isActive ? "visible" : "hidden"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto h-8 rounded-none"
                        >
                          Save
                        </Button>
                      </div>
                    </form>
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      <form action={toggleFeedbackAction.bind(null, item.id)}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-none"
                        >
                          {item.isActive ? "Hide" : "Show"}
                        </Button>
                      </form>
                      <form action={deleteFeedbackAction.bind(null, item.id)}>
                        <ConfirmSubmitButton message="Remove this screenshot from the feedback wall? The image stays in the media library.">
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-7 border border-dashed p-6 text-center text-sm text-muted-foreground">
              No feedback yet. Upload customer screenshots above to start the
              homepage feedback wall.
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="mt-6 rounded-none">
        <CardHeader>
          <CardTitle className="font-heading text-3xl">
            Policy content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 lg:grid-cols-2">
            {policies.map((policy) => (
              <form
                key={policy.id}
                action={updatePolicyAction.bind(null, policy.id)}
                className="grid gap-3 border p-4"
              >
                <div>
                  <Label htmlFor={`title-${policy.id}`}>
                    {policy.type.toLowerCase()}
                  </Label>
                  <Input
                    id={`title-${policy.id}`}
                    name="title"
                    defaultValue={policy.title}
                    required
                  />
                </div>
                <Textarea
                  name="content"
                  defaultValue={policy.content}
                  rows={7}
                  minLength={20}
                  required
                />
                <Button variant="outline" className="rounded-none">
                  Save policy
                </Button>
              </form>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  ) ;
}
