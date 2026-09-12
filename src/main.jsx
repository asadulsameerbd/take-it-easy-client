import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import Swal from "sweetalert2";
import "./styles.css";

const PRODUCTS = [
  {
    id: 1,
    name: "Naruto Black",
    sizes: { M: 2, L: 2 },
    tone: "#151515",
    image: "/assets/naruto.jpg",
  },
  {
    id: 2,
    name: "GTA Drop Shoulder",
    sizes: { M: 1, L: 2, XL: 1 },
    tone: "#242424",
    image: "/assets/gtav.jpeg",
  },
  {
    id: 3,
    name: "One Piece Oversized Drop Shoulder",
    sizes: { M: 2, L: 2, XL: 1 },
    tone: "#c9c9c2",
    image: "/assets/one_piece.jpeg",
  },
  {
    id: 4,
    name: "Backwoods Oversized Drop Shoulder",
    sizes: { M: 2, L: 2, XL: 1 },
    tone: "#303030",
    image: "/assets/backwoods.jpeg",
  },
  {
    id: 5,
    name: "Ferrari Oversized Drop Shoulder Classic",
    sizes: { M: 2, L: 2, XL: 0 },
    tone: "#202020",
    image: "/assets/classic_ferrari.jpeg",
  },
  {
    id: 6,
    name: "Ferari Oversized Drop Shoulder Dynamic",
    sizes: { M: 2, L: 2, XL: 1 },
    tone: "#3b3b3b",
    image: "/assets/ferari_3.jpeg",
  },
  {
    id: 7,
    name: "Weekend Oversized Drop Shoulder",
    sizes: { M: 2, L: 2, XL: 1 },
    tone: "#505050",
    image: "/assets/weekend.jpeg",
  },
];

const PAYMENT_INFO = {
  bkash: { name: "bKash", number: "01933200699", type: "Personal" },
  nagad: { name: "Nagad", number: "01933200699", type: "Personal" },
  rocket: { name: "Rocket", number: "01933200699", type: "Personal" },
};

function App() {
  const [cart, setCart] = useState([]);
  const [size, setSize] = useState(
    Object.fromEntries(
      PRODUCTS.map((p) => [
        p.id,
        Object.keys(p.sizes).find((s) => p.sizes[s] > 0),
      ]),
    ),
  );
  const [coupon, setCoupon] = useState("");
  const [area, setArea] = useState("80");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [transactionId, setTransactionId] = useState("");
  const [paymentImage, setPaymentImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [sending, setSending] = useState(false);

  const qty = cart.reduce((a, x) => a + x.qty, 0);
  const discountRate = coupon.trim().toUpperCase() === "TIE5" ? 30 : 0;
  const unit = 550 - discountRate;
  const subtotal = qty * 550;
  const discount = qty * discountRate;
  const total = qty * unit + Number(area);

  const items = useMemo(
    () =>
      cart.map((x) => ({ ...x, product: PRODUCTS.find((p) => p.id === x.id) })),
    [cart],
  );

  const add = (p) => {
    const selectedSize = size[p.id];

    if (!selectedSize || !p.sizes[selectedSize]) {
      Swal.fire({
        icon: "warning",
        title: "Size নির্বাচন করুন",
        text: "অর্ডারে যোগ করার আগে একটি available size নির্বাচন করুন।",
        confirmButtonText: "ঠিক আছে",
      });
      return;
    }

    setCart((currentCart) => {
      const found = currentCart.find(
        (x) => x.id === p.id && x.size === selectedSize,
      );

      if (found) {
        return currentCart.map((x) =>
          x === found
            ? { ...x, qty: Math.min(x.qty + 1, p.sizes[selectedSize]) }
            : x,
        );
      }

      return [...currentCart, { id: p.id, size: selectedSize, qty: 1 }];
    });

    Swal.fire({
      icon: "success",
      title: "অর্ডারে যোগ হয়েছে!",
      text: `${p.name} • Size ${selectedSize} আপনার অর্ডারে যোগ করা হয়েছে।`,
      confirmButtonText: "ঠিক আছে",
      timer: 1800,
      timerProgressBar: true,
    });
  };

  const change = (i, d) => {
    setCart((currentCart) =>
      currentCart.flatMap((x, idx) =>
        idx !== i ? [x] : [{ ...x, qty: x.qty + d }].filter((y) => y.qty > 0),
      ),
    );
  };

  const clearCart = () => {
    if (!items.length) {
      Swal.fire({
        icon: "info",
        title: "অর্ডার লিস্ট খালি",
        text: "মুছে ফেলার মতো কোনো product নেই।",
        confirmButtonText: "ঠিক আছে",
      });
      return;
    }

    Swal.fire({
      icon: "warning",
      title: "অর্ডার লিস্ট খালি করবেন?",
      text: "আপনার নির্বাচিত সব product মুছে যাবে।",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, মুছে দিন",
      cancelButtonText: "না",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setCart([]);
        Swal.fire({
          icon: "success",
          title: "অর্ডার লিস্ট পরিষ্কার",
          text: "সব selected product সরিয়ে দেওয়া হয়েছে।",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const uploadPaymentImage = async () => {
    if (!paymentImage) return "";

    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Payment image upload-এর জন্য VITE_IMGBB_API_KEY সেট করা হয়নি।",
      );
    }

    setUploadingImage(true);

    try {
      const body = new FormData();
      body.append("image", paymentImage);

      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${apiKey}`,
        { method: "POST", body },
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Payment image upload failed");
      }

      return data.data.url;
    } finally {
      setUploadingImage(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!items.length) {
      Swal.fire({
        icon: "warning",
        title: "কোনো product নির্বাচন করা হয়নি",
        text: "অর্ডার করার আগে অন্তত একটি টি-শার্ট আপনার order list-এ যোগ করুন।",
        confirmButtonText: "Product দেখুন",
      }).then(() => {
        document
          .getElementById("products")
          ?.scrollIntoView({ behavior: "smooth" });
      });
      return;
    }

    if (!form.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "নাম প্রয়োজন",
        text: "অর্ডার সম্পন্ন করতে আপনার নাম লিখুন।",
        confirmButtonText: "ঠিক আছে",
      });
      return;
    }

    if (!form.phone.trim()) {
      Swal.fire({
        icon: "warning",
        title: "মোবাইল নম্বর প্রয়োজন",
        text: "ডেলিভারির জন্য একটি সচল মোবাইল নম্বর দিন।",
        confirmButtonText: "ঠিক আছে",
      });
      return;
    }

    if (!form.address.trim()) {
      Swal.fire({
        icon: "warning",
        title: "ডেলিভারি ঠিকানা প্রয়োজন",
        text: "আপনার সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।",
        confirmButtonText: "ঠিক আছে",
      });
      return;
    }

    if (paymentMethod !== "cod" && !transactionId.trim() && !paymentImage) {
      Swal.fire({
        icon: "warning",
        title: "Payment information দিন",
        text: "bKash/Nagad/Rocket নির্বাচন করলে Transaction ID অথবা payment screenshot দিন।",
        confirmButtonText: "ঠিক আছে",
        confirmButtonColor: "#ff5a00",
      });
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "অর্ডারটি নিশ্চিত করবেন?",
      html: `
        <div class="hind" style="text-align:left;font-size:14px;line-height:1.8;">
          <b>Customer:</b> ${form.name}<br/>
          <b>Products:</b> ${qty} piece<br/>
          <b>Delivery:</b> ${Number(area)}Tk<br/>
          <b>Payment:</b> ${paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod.toUpperCase()}<br/>
          <b>Total:</b> ${total}Tk
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, অর্ডার করুন",
      cancelButtonText: "পরে করব",
      reverseButtons: true,
      confirmButtonColor: "#ff5a00",
    });

    if (!confirmation.isConfirmed) return;

    setSending(true);

    Swal.fire({
      title: "অর্ডার প্রসেস হচ্ছে...",
      text: "আপনার order information server-এ পাঠানো হচ্ছে।",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      let paymentImageUrl = "";

      if (paymentMethod !== "cod" && paymentImage) {
        paymentImageUrl = await uploadPaymentImage();
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/orders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: form,
            payment: {
              method: paymentMethod,
              transactionId: transactionId.trim(),
              imageUrl: paymentImageUrl,
              status: paymentMethod === "cod" ? "pending" : "submitted",
            },
            deliveryArea: Number(area),
            coupon: coupon.trim().toUpperCase(),
            items: items.map((x) => ({
              productId: x.id,
              productName: x.product.name,
              size: x.size,
              qty: x.qty,
            })),
            pricing: {
              subtotal,
              discount,
              delivery: Number(area),
              total,
              unitPrice: unit,
            },
          }),
        },
      );

      const contentType = res.headers.get("content-type") || "";

      let data;

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(
          `Server response JSON নয়। Status: ${res.status}. ${text.slice(0, 150)}`,
        );
      }

      if (!res.ok) {
        throw new Error(data.message || "Order failed");
      }

      setCart([]);
      setPaymentMethod("cod");
      setTransactionId("");
      setPaymentImage(null);
      setCoupon("");

      await Swal.fire({
        icon: "success",
        title: "অর্ডার সফলভাবে গ্রহণ করা হয়েছে! 🎉",
        html: `
          <div class="hind" style="line-height:1.8;">
            ধন্যবাদ <b>${form.name}</b>!<br/>
            আপনার <b>${qty} piece</b> টি-শার্টের order আমাদের কাছে পৌঁছেছে।<br/><br/>
            <strong>মোট: ${total}Tk</strong><br/>
            আমাদের team আপনার order verify করে শীঘ্রই আপনার সাথে যোগাযোগ করবে।
          </div>
        `,
        confirmButtonText: "ঠিক আছে",
        confirmButtonColor: "#ff5a00",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "অর্ডার সম্পন্ন করা যায়নি",
        text:
          err.message ||
          "দুঃখিত, অর্ডার পাঠানোর সময় একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        confirmButtonText: "আবার চেষ্টা করুন",
        confirmButtonColor: "#ff5a00",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/*-------------------------- main Code Start from here-------------------------------------- */}
      <header className="nav">
        <div className="wrap navin">
          <a href="#" className="brand w-18">
            <img src="/assets/logo.jpg" alt="Take It Easy" />
          </a>
          <a
            className="bg-black text-white! px-5 py-3 rounded-lg hind hover:bg-[#FF5A00]"
            href="#order"
          >
            অর্ডার করুন →
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap herogrid">
            <div className="max-w-2xl">
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-300/10 px-4 py-2 poppins text-xs font-semibold tracking-wide text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  NEW DROP <span className="text-gray-400">•</span> LIMITED
                  STOCK
                </span>
              </div>

              <h1 className="space text-5xl md:text-6xl lg:text-7xl font-semibold leading-[0.95] tracking-tight">
                Wear it easy.
                <br />
                <span className="text-orange-600">Own the look.</span>
              </h1>

              <p className="hind mt-6 max-w-xl text-lg md:text-xl leading-8 text-gray-600">
                Premium oversized drop shoulder টি-শার্ট।
                <br className="hidden md:block" />
                Heavy GSM, clean fit আর everyday comfort একসাথে।
              </p>

              <div className="actions mt-8 flex flex-wrap gap-3">
                <a
                  href="#products"
                  className="group text-white! inline-flex items-center justify-center gap-2 rounded-lg bg-[#F54900] px-7 py-3.5 hind text-lg font-medium shadow-lg shadow-orange-600/20 transition-all duration-300 hover:-translate-y-1 hover:bg-orange-700 hover:shadow-xl hover:shadow-orange-600/30 cursor-pointer"
                >
                  Collection দেখুন{" "}
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </a>
                <a
                  href="#order"
                  className="group inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-7 py-3.5 hind text-lg font-medium text-black transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-black hover:bg-black hover:text-white!"
                >
                  Quick Order{" "}
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 poppins text-xs md:text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-green-600 font-bold">✓</span>Premium
                  Cotton
                </span>
                <span className="hidden sm:block h-1 w-1 rounded-full bg-gray-300" />
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-green-600 font-bold">✓</span>COD
                  Available
                </span>
                <span className="hidden sm:block h-1 w-1 rounded-full bg-gray-300" />
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-orange-600 font-bold">✓</span>Limited
                  Stock
                </span>
              </div>
            </div>

            <div className="heroVisual">
              <div className="ring" />
              <img src="/assets/favicon.jpeg" alt="Take It Easy" />
            </div>
          </div>
        </section>

        {/* Coupon Section */}

        <section className="py-8">
          <div className="wrap">
            <div className="promoin flex flex-col md:flex-row items-center justify-between gap-5 rounded-2xl border border-white/50 bg-[#111111] px-6 py-5 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F54900]/10 text-2xl">
                  🎟️
                </div>
                <div className="flex flex-col">
                  <b className="block space text-sm font-semibold text-white">
                    NEW PAGE COUPON
                  </b>
                  <p className="space mt-1 text-sm text-gray-300">
                    Use code{" "}
                    <strong className="rounded-md bg-white px-2 py-1 font-mono text-black">
                      TIE5
                    </strong>{" "}
                    and get it for{" "}
                    <strong className="text-white">520Tk/piece</strong>
                  </p>
                </div>
              </div>
              <a
                href="#order"
                className="btn hind group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-all duration-300 hover:bg-[#F54900] hover:text-white! hover:shadow-[0_0_25px_rgba(245,73,0,0.35)]"
              >
                অর্ডার করুন{" "}
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* Choose Your Drop Section  */}

        <section id="products" className="section">
          <div className="wrap">
            <div className="head">
              <div>
                <div className="space font-medium pb-4 text-[#FF5A00]">
                  THE COLLECTION
                </div>
                <h2 className="space font-medium">Choose your drop.</h2>
              </div>
              <div className=" space">
                <del>600Tk</del> <b className="text-[#FF5A00]">550Tk</b>{" "}
                <small>/piece</small>
              </div>
            </div>

            <div className="grid">
              {PRODUCTS.map((p) => (
                <article className="product" key={p.id}>
                  <div className="art group relative flex items-center justify-center overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-contain object-center p-2 transition-transform duration-700 ease-out group-hover:scale-110"
                      loading="lazy"
                    />

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/0 transition-all duration-500 group-hover:ring-white/25" />
                  </div>

                  <div className="pi">
                    {/* Product Title */}
                    <h3 className="space text-3xl font-medium">{p.name}</h3>

                    {/* Product Description */}
                    <small className="space text-xl">
                      Premium Oversized Drop Shoulder • 220+ GSM Heavyweight
                      Cotton
                    </small>

                    <div className="sizes">
                      {Object.entries(p.sizes).map(([s, n]) => (
                        <button
                          type="button"
                          disabled={!n}
                          className={size[p.id] === s ? "sel" : ""}
                          onClick={() => setSize({ ...size, [p.id]: s })}
                          key={s}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    <div className="stock">
                      {size[p.id]} Size-এ <b>{p.sizes[size[p.id]] || 0}</b>{" "}
                      Piece Available
                    </div>

                    <button
                      type="button"
                      className="add group space relative overflow-hidden text-white! transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:bg-[#ff5a00]! hover:shadow-[0_14px_30px_rgba(245,73,0,0.28)] active:translate-y-0"
                      onClick={() => add(p)}
                    >
                      <span className="relative z-10 inline-flex items-center gap-2">
                        Add to Order{" "}
                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>{" "}
                        <span className="font-semibold">550Tk</span>
                      </span>

                      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Combo Section------------ */}
        <section className="combo">
          <div className="wrap combobox">
            <div>
              <div className="space text-[#ff5a00] pb-4">BUILD YOUR COMBO</div>
              <h2 className="space font-medium pb-4">
                More pieces.
                <br />
                <span>Better deal.</span>
              </h2>
              <p className="hind">
                Coupon TIE5 ব্যবহার করলে selected প্রতিটি piece 520Tk। Delivery
                আলাদা হিসাব হবে।
              </p>
            </div>
            <div className="comboCards">
              <div>
                <b>1 Piece</b>
                <strong>550Tk</strong>
              </div>
              <div>
                <b>2 Pieces</b>
                <strong>1,100Tk</strong>
              </div>
              <div className="hot">
                <em>TIE5</em>
                <b>Coupon</b>
                <strong>520Tk</strong>
              </div>
            </div>
          </div>
        </section>

        {/* review Section -------- */}

        <section className="reviews section">
          <div className="wrap">
            <div className="space text-[#ff5a00] pb-4">CUSTOMER REVIEWS</div>
            <h2 className="space font-medium pb-4">
              People who wore it,
              <br />
              <span className="font-semibold text-red-700">loved </span> the
              fit.
            </h2>
            <div className="reviewgrid">
              {[
                "Fitটা clean, কাপড়টা heavy আর printটা খুব sharp.",
                "Oversized fitটা ঠিক যেরকম চেয়েছিলাম. Delivery-ও smooth.",
                "একটা নেওয়ার পর আরেকটা design নিয়েছি. Fabric quality nice.",
              ].map((t, i) => (
                <article key={i}>
                  <div className="stars">★★★★★</div>
                  <p className="hind">“{t}”</p>
                  <b>— Customer {i + 1}, Dhaka</b>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Order Section----------------- */}

        <section id="order" className="order">
          <div className="wrap ordergrid">
            <div className="ocopy">
              <div className="space text-[#ff5a00] pb-4">QUICK ORDER</div>
              <h2 className="space font-medium pb-4">
                Ready to{" "}
                <span className="font-semibold text-red-700">
                  wear it easy?
                </span>
              </h2>
              <p className="hind">
                অর্ডার করতে ফর্মটি পূরণ করুন এবং প্রয়োজনীয় তথ্য ও পেমেন্ট
                কমপ্লিট করুন। অর্ডার করার ২-৪ দিন এর মধ্যে আপনার পণ্য পেয়ে যাবেন
                ইনশাআল্লাহ
              </p>
              <div className="delivery">
                <div>
                  <span>Inside Dhaka</span>
                  <b>80 Tk</b>
                </div>

                <div>
                  <span>Outside Dhaka</span>
                  <b>130 Tk</b>
                </div>

                <div>
                  <span>Payment</span>
                  <b>COD + bKash, Nagad, Rocket</b>
                </div>
              </div>

              <p className="hind pt-4">
                যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন
              </p>

              <div className="mt-3 flex items-center gap-3">
                <a
                  href="https://www.facebook.com/takeiteasybangladesh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <span>f</span>
                  Facebook
                </a>

                <a
                  href="https://wa.me/8801933200699"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <span>◉</span>
                  WhatsApp
                </a>
              </div>
            </div>

            <form className="form" onSubmit={submit}>
              <div className="twocol">
                <label className="hind">
                  নাম
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="আপনার নাম"
                  />
                </label>
                <label className="hind">
                  মোবাইল
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="01XXXXXXXXX"
                  />
                </label>
              </div>

              <label className="hind">
                ঠিকানা
                <textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="বাড়ি, রোড, এলাকা,জেলা , বিভাগ (যেমন: 123, ABC Road, Dhaka, Bangladesh)"
                />
              </label>

              <div className="twocol">
                <label>
                  Delivery
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  >
                    <option value="80">Inside Dhaka — 80Tk</option>
                    <option value="130">Outside Dhaka — 130Tk</option>
                  </select>
                </label>
                <label>
                  Coupon
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="TIE5"
                  />
                </label>
              </div>

              <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hind">
                <div className="mb-4">
                  <b className="block text-base text-black">Payment Method</b>
                  <small className="mt-1 block text-gray-500">
                    bKash, Nagad, Rocket অথবা Cash on Delivery নির্বাচন করুন।
                  </small>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    {
                      id: "bkash",
                      label: "bKash",
                      icon: "/icons/bkash.jpg",
                    },
                    {
                      id: "nagad",
                      label: "Nagad",
                      icon: "/icons/nagad.png",
                    },
                    {
                      id: "rocket",
                      label: "Rocket",
                      icon: "/icons/rocket.png",
                    },
                    {
                      id: "cod",
                      label: "Cash on Delivery",
                      icon: "🚚",
                    },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`group rounded-xl border px-3 py-3 text-left transition-all duration-300 ${
                        paymentMethod === method.id
                          ? "border-[#F54900] bg-[#fff4ee] shadow-[0_8px_25px_rgba(245,73,0,0.12)]"
                          : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-md"
                      }`}
                    >
                      <span
                        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${
                          paymentMethod === method.id
                            ? " text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {method.id === "cod" ? (
                          <span className="text-sm font-bold">🚚</span>
                        ) : (
                          <img
                            src={method.icon}
                            alt={method.label}
                            className="h-7 w-7 object-contain"
                          />
                        )}
                      </span>

                      <span className="block text-xs font-semibold text-black">
                        {method.label}
                      </span>
                    </button>
                  ))}
                </div>

                {paymentMethod !== "cod" && (
                  <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                    <div className="mb-4 rounded-lg bg-white p-3">
                      <p className="text-xs text-gray-500">Send payment to</p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <div>
                          <b className="text-sm text-black">
                            {PAYMENT_INFO[paymentMethod].name}
                          </b>
                          <p className="text-sm font-mono text-gray-700">
                            {PAYMENT_INFO[paymentMethod].number}
                          </p>
                        </div>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                          {PAYMENT_INFO[paymentMethod].type}
                        </span>
                      </div>
                    </div>

                    <label>
                      Transaction ID
                      <input
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="যেমন: 8N7ABC123"
                        className="mt-1"
                      />
                    </label>

                    <div className="mt-3">
                      <label className="block">
                        Payment Screenshot
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setPaymentImage(e.target.files?.[0] || null)
                          }
                          className="mt-1 block w-full cursor-pointer rounded-xl border border-dashed border-gray-300 bg-white p-3 text-sm"
                        />
                      </label>
                      {paymentImage && (
                        <p className="mt-2 text-xs text-green-700">
                          ✓ {paymentImage.name} selected
                        </p>
                      )}
                      <small className="mt-2 block text-gray-500">
                        Transaction ID অথবা screenshot যেকোনো একটি দিলেই হবে।
                      </small>
                    </div>
                  </div>
                )}
              </div>

              <div className="cartbox">
                <div className="carthead">
                  <b>Your Order</b>
                  <button type="button" onClick={clearCart}>
                    Clear
                  </button>
                </div>
                {!items.length ? (
                  <div className="empty hind">
                    উপরে থেকে product select করুন
                  </div>
                ) : (
                  items.map((x, i) => (
                    <div className="cartitem" key={`${x.id}-${x.size}`}>
                      <div>
                        <b>{x.product.name}</b>
                        <small>
                          Size {x.size} • {unit}Tk/piece
                        </small>
                      </div>
                      <div className="qty">
                        <button type="button" onClick={() => change(i, -1)}>
                          −
                        </button>
                        <b>{x.qty}</b>
                        <button type="button" onClick={() => change(i, 1)}>
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="summary">
                <div>
                  <span>Products</span>
                  <b>{subtotal}Tk</b>
                </div>
                <div>
                  <span>Discount</span>
                  <b>-{discount}Tk</b>
                </div>
                <div>
                  <span>Delivery</span>
                  <b>{area}Tk</b>
                </div>
                <div className="total">
                  <span>Total</span>
                  <b>{total}Tk</b>
                </div>
              </div>

              <button
                type="submit"
                className="submit group relative overflow-hidden !text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(245,73,0,0.25)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={sending || uploadingImage}
              >
                <span className="relative z-10 inline-flex items-center justify-center gap-2">
                  {sending || uploadingImage
                    ? "Order প্রসেস হচ্ছে..."
                    : "অর্ডার কনফার্ম করুন"}
                  {!sending && !uploadingImage && (
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  )}
                </span>
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>

              <small className="note hind">
                অর্ডার করার ২-৪ দিন এর মধ্যে আপনার পণ্য পেয়ে যাবেন ইনশাআল্লাহ
              </small>
            </form>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap foot">
          <a href="#" className="brand w-18 pt-4">
            <img src="/assets/logo.jpg" alt="Take It Easy" />
          </a>
          <span>© 2026 Take It Easy • Wear It Easy</span>
        </div>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
