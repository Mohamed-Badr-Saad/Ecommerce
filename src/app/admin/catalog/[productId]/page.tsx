import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAdminCatalog, getAdminProduct } from "@/lib/admin-catalog";
import { addProductImageAction, addVariantAction, archiveProductAction, attachTagAction, updateProductAction, updateProductCollectionsAction, updateVariantStockAction } from "../actions";

type Props = { params: Promise<{ productId: string }> };

export default async function AdminProductPage({ params }: Props) {
  const { productId } = await params;
  const [product, catalog] = await Promise.all([getAdminProduct(productId), getAdminCatalog()]);
  if (!product) notFound();
  const availableTags = catalog.tags.filter((tag) => !product.tags.some((current) => current.id === tag.id));
  return <section>
    <Link href="/admin/catalog" className="text-sm text-muted-foreground hover:text-foreground">← Catalog</Link>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">Product editor</p><h2 className="mt-2 font-heading text-5xl">{product.title}</h2></div><Badge variant="outline" className="rounded-none">{product.status.toLowerCase()}</Badge></div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,.8fr)]">
      <Card className="rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Details</CardTitle></CardHeader><CardContent><form action={updateProductAction.bind(null, product.id)} className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="edit-title">Title</Label><Input id="edit-title" name="title" defaultValue={product.title} required /></div><div><Label htmlFor="edit-slug">Slug</Label><Input id="edit-slug" name="slug" defaultValue={product.slug} required /></div>
        <div className="sm:col-span-2"><Label htmlFor="edit-description">Description</Label><Textarea id="edit-description" name="description" defaultValue={product.description} required /></div>
        <div><Label htmlFor="edit-category">Category</Label><select id="edit-category" name="categoryId" defaultValue={product.categoryId} className="h-10 w-full border bg-background px-3 text-sm">{catalog.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><div><Label htmlFor="edit-status">Status</Label><select id="edit-status" name="status" defaultValue={product.status} className="h-10 w-full border bg-background px-3 text-sm"><option>DRAFT</option><option>ACTIVE</option><option>ARCHIVED</option></select></div>
        <div><Label htmlFor="edit-price">Price</Label><Input id="edit-price" name="price" type="number" step=".01" min=".01" defaultValue={Number(product.price)} required /></div><div><Label htmlFor="edit-compare">Compare at</Label><Input id="edit-compare" name="compareAtPrice" type="number" step=".01" min="0" defaultValue={product.compareAtPrice ? Number(product.compareAtPrice) : ""} /></div>
        <div><Label htmlFor="edit-sku">Base SKU</Label><Input id="edit-sku" name="sku" defaultValue={product.sku ?? ""} /></div><div><Label htmlFor="edit-stock">Total stock</Label><Input id="edit-stock" name="stockQuantity" type="number" min="0" defaultValue={product.stockQuantity} required /></div>
        <div><Label htmlFor="edit-threshold">Low-stock threshold</Label><Input id="edit-threshold" name="lowStockThreshold" type="number" min="0" defaultValue={product.lowStockThreshold} required /></div><label className="flex items-end gap-2 pb-2 text-sm"><input name="isFeatured" type="checkbox" defaultChecked={product.isFeatured} /> Featured</label>
        <Button className="rounded-none sm:col-span-2">Save product</Button>
      </form><form action={archiveProductAction.bind(null, product.id)} className="mt-3"><Button variant="outline" className="w-full rounded-none" disabled={product.status === "ARCHIVED"}>Archive product</Button></form></CardContent></Card>

      <div className="space-y-6">
        <Card className="rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Variants & inventory</CardTitle></CardHeader><CardContent><ul className="divide-y">{product.variants.map((variant) => <li key={variant.id} className="py-3"><div className="flex justify-between gap-4"><div><p className="font-medium">{variant.title}</p><p className="text-xs text-muted-foreground">{variant.sku}</p></div><form action={updateVariantStockAction.bind(null, product.id, variant.id)} className="flex gap-2"><Input name="stockQuantity" type="number" min="0" defaultValue={variant.stockQuantity} className="w-20" aria-label={`Stock for ${variant.title}`} /><Button size="sm" variant="outline" className="rounded-none">Save</Button></form></div></li>)}</ul>
          <form action={addVariantAction.bind(null, product.id)} className="mt-5 grid grid-cols-2 gap-3 border-t pt-5"><Input name="title" placeholder="Title" required /><Input name="sku" placeholder="SKU" required /><Input name="color" placeholder="Color" /><Input name="colorHex" placeholder="#681321" /><Input name="size" placeholder="Size" /><Input name="stockQuantity" type="number" min="0" defaultValue="0" required /><Input name="price" type="number" min="0" step=".01" placeholder="Override price" className="col-span-2" /><Button className="col-span-2 rounded-none">Add variant</Button></form>
        </CardContent></Card>
        <Card className="rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Images & tags</CardTitle></CardHeader><CardContent><ul className="space-y-2 text-sm">{product.images.map((image) => <li key={image.id} className="break-all border p-2">{image.isPrimary ? "Primary · " : ""}{image.url}</li>)}</ul><form action={addProductImageAction.bind(null, product.id)} className="mt-4 grid gap-3"><Input name="url" type="text" placeholder="UploadThing URL or /local-image.svg" required /><Input name="altText" placeholder="Alt text (defaults to product title)" /><Button className="rounded-none">Add image</Button></form>
          <div className="mt-5 flex flex-wrap gap-2">{product.tags.map((tag) => <Badge key={tag.id} variant="outline" className="rounded-none">{tag.name}</Badge>)}</div>{availableTags.length ? <form action={attachTagAction.bind(null, product.id)} className="mt-3 flex gap-2"><select name="tagId" className="h-10 flex-1 border bg-background px-3 text-sm">{availableTags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select><Button variant="outline" className="rounded-none">Attach</Button></form> : null}
        </CardContent></Card>
        <Card className="rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Collections</CardTitle></CardHeader><CardContent><form action={updateProductCollectionsAction.bind(null, product.id)} className="grid gap-3">{catalog.collections.map((collection) => <label key={collection.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="collectionIds" value={collection.id} defaultChecked={product.collections.some((current) => current.id === collection.id)} /> {collection.name}</label>)}<Button variant="outline" className="mt-2 rounded-none">Save collections</Button></form></CardContent></Card>
      </div>
    </div>
  </section>;
}
